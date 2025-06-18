# Review and Merge Process Guide

This guide provides step-by-step instructions for creating a Markdown (.md) file, reviewing it, and merging it into the working or main branch.

## Creating a Markdown File in VS Code

1. Go to **File** > **New File**.
2. Add your content to the new file.
3. Save the file with a `.md` extension via **File** > **Save**.
4. Stage your changes by clicking on **Source Control** in the Activity Bar, then entering a commit message and clicking **Commit**.
5. If prompted, click **Yes** to confirm the commit in the VS Code pop-up window.

![Committing Changes in VS Code]((https://github.com/rshubhani/rshubhani.github.io/blob/main/images/image-4.png))

6. Click **Sync Changes** to push your commit and pull any remote updates.
7. Alternatively, you can use the terminal to run `git pull` and `git push` commands to sync your changes. 


## Steps to Perform Peer Review

1. **Push your changes:**  
    Ensure all your latest changes are committed and pushed to the remote repository.

2. **Create a Merge Request (MR):**  
    Open the GitLab Workflow in VS Code.  
    Press `Ctrl+Shift+P` and select **GitLab: Create new Merge request on Current Project** from the dropdown.  
    Click **Open** to launch GitLab in your browser.

![alt text](2025-06-05_13-58-58.png)
 

3. **Assign a Reviewer:**  
    In GitLab (browser), create the Merge Request and assign it to a reviewer.  
    Click on **Create Merge Request** to submit your request.

> **Note**: To view reviewer comments or feedback, you click the dialogue icon in the Merge Request under **Gitlab Workflow**.

![alt text](2025-06-05_14-07-55.png)

### How to Add Review Comments in VS Code

When you are assigned as a reviewer, you will receive a review email.

1. Open VS Code and go to the **GitLab Workflow** extension.
2. Click **Refresh** to update the list of merge requests.
3. Select **Merge Requests assigned to me**.
4. Open the relevant file from the merge request. For example: test.md 
5. To add a review comment, click the **+** icon next to the line where you want to comment and enter your feedback.

![alt text](add_comment-1.png)


> **Note:**  
> Before merging, always sync your local branch with the latest remote changes:
> - Pull the latest changes before pushing or merging.
> - Not syncing can cause merge conflicts.
> - Ensure your branch is up to date with the base branch before creating a Merge Request.


## Approve and Merge

1. Open GitLab using the link provided in the review email, or navigate to your project in GitLab.
2. Review the merge request details and any comments.
3. Click **Approve** to approve the merge request.

    ![alt text](<image (7).png>)


4. (Optional) Add a final comment if needed.
5. Click **Merge** to complete the process and merge the changes into the target branch.

> **Note:** If your access token has exired create anew one and add the token in the pasword field when Git Credential Manager.  
