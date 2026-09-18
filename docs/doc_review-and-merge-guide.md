# Documentation Review and Merge Guide Using Visual Studio Code

This guide provides step-by-step instructions for authoring Markdown (`.md`) documentation, collaborating through peer review, and merging changes into the target branch using Visual Studio Code and the GitLab Workflow extension.



## 1. Create and Author a Topic Branch

Always author new documentation on a dedicated topic branch rather than committing directly to `main`.

1. Open your documentation repository in **VS Code**.
2. Open the integrated terminal (`Ctrl+` `) and create a new feature branch:

> ```bash
> git checkout -b docs/add-feature-guide
> Create your content file by selecting File > New File (e.g., feature-guide.md).

3. Author your content using standard Markdown syntax and save the file (File > Save).
4. In the Activity Bar, click Source Control (or press Ctrl+Shift+G).
5. Stage your modified files, enter a concise commit message (e.g., docs: add feature deployment guide), and click Commit.

## Open a Merge Request (MR)
Push your topic branch and open a review request directly from the editor:

1. In the terminal, push your branch to the remote repository:

> ```bash
>git push -u origin docs/add-feature-guide

2. Press Ctrl+Shift+P to open the Command Palette.
3. Search for and select GitLab: Create new Merge Request on Current Project.
4. Click Open to launch the GitLab merge request form in your browser.
5. In the GitLab interface:
* Specify the Target Branch (e.g., main or staging).
* Select a primary reviewer from the Assignee or Reviewers field.
* Add a brief summary of the documentation changes and link any related Jira issue keys.
6. Click Create Merge Request.

> **Note:** To monitor reviewer feedback inside VS Code, open the GitLab Workflow extension icon in the Activity Bar and expand your active Merge Requests.

## Conduct Peer Review in VS Code
When assigned as a technical or editorial reviewer:

1. Open VS Code and select the GitLab Workflow icon in the Activity Bar.
2. Click Refresh to retrieve the latest review queue.
3. Expand Merge Requests assigned to me and select the target request.
4. Click on a modified file to inspect the diff view.
5. To post an inline review comment, hover over the relevant line number, click the + (Add Comment) icon, enter your feedback, and click Add Comment.

**Best Practice:** Before final approval, always rebase or pull from the base branch to resolve potential conflicts early:

> ```bash
> git fetch origin
> git rebase origin/main
> ```


## 4. Approve and Merge

Once all review discussions are resolved and automated CI linters pass:

1. Navigate to the Merge Request page in GitLab (via browser or the notification email).
2. Verify that all discussions are marked **Resolved**.
3. Click **Approve**.
4. *(Optional)* Check **Delete source branch** and **Squash commits** to maintain a clean Git history.
5. Click **Merge** to integrate the updates into the production branch.

> **Tip:** If authentication fails during push or pull operations, verify that your GitLab Personal Access Token (PAT) has the `read_repository` and `write_repository` scopes enabled and has not expired.
