# Example Endpoint Agent Release Notes
## Version 5.0.1 and Version 4.8.5

**Release date:** September 2026  
**Supported platforms:** Windows, macOS, and Linux

## Release overview

This release provides the Example Endpoint Agent 5.0.1 maintenance update and the Example Endpoint Agent 4.8.5 maintenance update. The releases include reliability improvements and resolved issues for endpoint policy processing and event reporting.

Install 5.0.1 if your organization is using the 5.0 release family. Install 4.8.5 if your organization remains on the 4.8 release family. Do not use an installer from one release family to update the other.

| Release | Type | Recommended for |
| --- | --- | --- |
| 5.0.1 | Maintenance release | Environments using Endpoint Agent 5.0.x |
| 4.8.5 | Maintenance release | Environments using Endpoint Agent 4.8.x |

> **Important:** Test the update with a representative pilot group before deploying it to all managed endpoints. Review your organization's supported operating-system matrix before installation.

## Version 5.0.1

### Enhancements

#### Improved content inspection reliability

Endpoint Agent 5.0.1 improves the reliability of content inspection during high-volume file activity. The update reduces duplicate processing and helps the agent continue inspection when an individual worker encounters an unexpected error. Policy outcomes and user workflows remain unchanged.

### Resolved issues

- Resolved an issue that could cause an application to become unresponsive during a file copy operation.
- Resolved an issue that could prevent some endpoints from reporting policy events after a network connection was restored.
- Resolved an issue that could cause the endpoint status page to display an outdated agent version after an in-place upgrade.

### Resource file changes

The 5.0.1 installer includes an updated default exclusion file. The update improves handling of common operating-system maintenance processes. No administrator action is required.

## Version 4.8.5

### Resolved issues

- Resolved an issue that could delay policy evaluation for applications launched from mapped network locations.
- Resolved an issue that could cause the agent service to restart unexpectedly after a user signs in.
- Resolved an issue that could prevent diagnostic logs from being collected when the local disk was low on space.

## Upgrade considerations

- Back up locally customized agent configuration files before installing an update.
- Restart the endpoint when prompted by the installer.
- After installation, confirm that the agent service is running and that the management console reports the updated version.
- Allow one normal check-in interval before investigating a device that does not immediately report its new version.

For a step-by-step procedure, see the *Enterprise Endpoint Agent Upgrade Guide*.

## Known issues

| Issue | Workaround |
| --- | --- |
| A device may display an outdated status immediately after reconnecting to the network. | Wait for the next check-in interval, then refresh the device status page. |
| The agent may require a restart after an operating-system update completes. | Restart the endpoint before evaluating policy or event-reporting behavior. |

## Build information

| Component | Version |
| --- | --- |
| Example Endpoint Agent | 5.0.1 / 4.8.5 |
| Management service compatibility | 5.0 or later |
