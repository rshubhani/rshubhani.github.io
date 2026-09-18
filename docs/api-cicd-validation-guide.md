# API Payload Validation in CI/CD

This guide validates policy API payloads before deployment. The pipeline checks the OpenAPI schema, sends a dry-run request, and stops the release when validation fails.

## 1. Define the request contract

The following OpenAPI 3.0 schema requires a policy name, enabled state, and at least one rule.

```yaml
openapi: 3.0.3
paths:
  /v1/policies:validate:
    post:
      responses:
        '204': { description: Payload is valid }
        '400': { description: Invalid JSON or schema violation }
        '401': { description: Missing or invalid token }
        '422': { description: Valid JSON with invalid policy logic }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, enabled, rules]
              properties:
                name: { type: string, minLength: 3 }
                enabled: { type: boolean }
                rules:
                  type: array
                  minItems: 1
                  items:
                    type: object
                    required: [match, action]
                    properties:
                      match: { type: string }
                      action: { type: string, enum: [allow, block, alert] }
```

## 2. Add the GitHub Actions validation step

Store the API token as `POLICY_API_TOKEN`; never commit it to the repository.

```yaml
- name: Validate policy payload
  env:
    API_URL: https://api.example.com/v1/policies:validate
    TOKEN: ${{ secrets.POLICY_API_TOKEN }}
  run: |
    status=$(curl --silent --show-error --output validation.json \
      --write-out '%{http_code}' --request POST "$API_URL" \
      --header "Authorization: Bearer $TOKEN" \
      --header 'Content-Type: application/json' \
      --data @policies/egress-policy.json)
    test "$status" = 204 || { cat validation.json; exit 1; }
```

## 3. Interpret failures

| Response | Meaning | Required action |
| --- | --- | --- |
| `204` | Payload passed validation | Continue to the deployment stage. |
| `400` | JSON is malformed or violates the schema | Correct the field identified in the response, then rerun the pipeline. |
| `401` | Token is missing, expired, or lacks access | Verify the secret and grant only validation scope. |
| `422` | Schema passes, but the policy conflicts with server rules | Review the returned path and message; update the policy or request an exception. |
| `5xx` | Validation service unavailable | Do not deploy. Retry according to the incident procedure. |

> **Verification:** Keep `validation.json` as a short-lived CI artifact for failed runs. Redact tokens, personal data, and production identifiers before attaching it to a ticket.

## Example valid payload

```json
{
  "name": "external-upload-alert",
  "enabled": true,
  "rules": [{"match": "destination.type == 'external'", "action": "alert"}]
}
```
