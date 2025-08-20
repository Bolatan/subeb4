# Deploying the Node.js Application to cPanel

This guide provides step-by-step instructions for deploying the application to a cPanel hosting environment.

## Step 1: Prepare Your Application Files

1.  **Clean Up**: Before uploading, make sure you have a clean project directory. Remove any local environment files (like `.env`) or temporary files. Do **not** upload the `node_modules` directory; you will install these on the server.
2.  **Compress**: Create a `.zip` archive of your project directory. This will make uploading faster and easier.

## Step 2: Upload and Extract Files in cPanel

1.  Log in to your cPanel account.
2.  Open the **File Manager**.
3.  Navigate to the directory where you want to host your application (e.g., `public_html` or a subdomain folder).
4.  Click **Upload** and select the `.zip` file you created in the previous step.
5.  Once the upload is complete, go back to the File Manager, right-click the `.zip` file, and select **Extract**.

## Step 3: Set Up the Node.js Application

1.  In the cPanel main dashboard, find the **Software** section and click on **Setup Node.js App**.
2.  Click **Create Application**.
3.  Fill out the application setup form:
    *   **Node.js version**: Select a recent LTS version (e.g., 18.x, 20.x).
    *   **Application mode**: Set to **Production**.
    *   **Application root**: Enter the path to your application's folder (the one you extracted the files into). For example, `/home/your_cpanel_username/public_html/your-app-folder`.
    *   **Application URL**: Select the domain or subdomain you want to use for this application.
    *   **Application startup file**: Enter `server.js`.
4.  Click **Create**. cPanel will set up the application environment.

## Step 4: Set Environment Variables

This is a critical step for application security and configuration.

1.  After the application is created, you will be taken back to the Node.js application list. Find your new application and look for the **Environment Variables** section.
2.  Click **Add Variable** and add the following variables one by one:

    *   **Variable Name**: `MONGODB_URI`
    *   **Variable Value**: `mongodb+srv://bolatan:Ogbogbo122@cluster0.vzjwn4g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` (Use the value provided to you).

    *   **Variable Name**: `JWT_SECRET`
    *   **Variable Value**: `your-super-secret-and-long-jwt-key` ( **IMPORTANT**: Replace this with a strong, randomly generated secret key. You can use an online generator to create a secure key.)

    *   **Variable Name**: `PORT`
    *   **Variable Value**: This is usually set automatically by cPanel's Node.js environment (Phusion Passenger). You can leave this blank unless you have a specific need to set it. The application will listen on the correct port assigned by the server.

3.  Click **Save** after adding the variables.

## Step 5: Install Dependencies and Start the Application

1.  Go back to your application's configuration page in the **Setup Node.js App** section.
2.  Click **NPM Install**. This will read your `package.json` file and install all the required dependencies. This may take a few minutes. You can see the progress in the cPanel interface.
3.  Once the installation is complete, click the **Restart** button at the top of the page.

## Step 6: Verify Your Deployment

Open your application's URL in a web browser. You should see the "Backend server is running!" message or be able to interact with your application's API endpoints.

If you encounter errors, check the application's log files. You can usually find these in the Node.js application setup page in cPanel. Common issues include incorrect environment variables or problems during the `npm install` step.
