# Define variables for your deployment
$resourceGroupName = "certiMaster-rg"
$storageAccountName = "certimasterstorage"
$frontendContainerName = '$web'
$location = "northeurope"
$frontendBuildFolder = "dist"  # Folder where the Vite build output is located

# Step 1: Check if the Resource Group exists
Write-Output "Checking if the resource group '$resourceGroupName' exists..."
$resourceGroupExists = (az group exists --name $resourceGroupName)
if (-not [bool]::Parse($resourceGroupExists)) {
    Write-Output "Error: Resource group '$resourceGroupName' does not exist. Please verify the resource group."
    exit 1
}

# Step 2: Check if the Storage Account exists
Write-Output "Checking if the storage account '$storageAccountName' exists in resource group '$resourceGroupName'..."
$storageAccountExists = az storage account show --name $storageAccountName --resource-group $resourceGroupName --query "name" --output tsv
if ($storageAccountExists -ne $storageAccountName) {
    Write-Output "Error: Storage account '$storageAccountName' does not exist. Please verify the storage account name."
    exit 1
} else {
    Write-Output "Storage account '$storageAccountName' exists."
}

# Step 3: Retrieve Storage Account Key and Connection String
Write-Output "Retrieving the primary key and connection string for the storage account '$storageAccountName'..."
$storageAccountKey = (az storage account keys list --resource-group $resourceGroupName --account-name $storageAccountName --query "[0].value" --output tsv)
$storageConnectionString = (az storage account show-connection-string --resource-group $resourceGroupName --name $storageAccountName --query connectionString --output tsv)

# Check if the connection string is valid
if (-not $storageConnectionString) {
    Write-Error "Failed to retrieve a valid connection string. Ensure the storage account '$storageAccountName' exists and has a connection string."
    exit 1
}

# Step 4: Enable Static Website Hosting on the Storage Account using the connection string
Write-Output "Enabling static website hosting on the storage account..."
az storage blob service-properties update --connection-string $storageConnectionString --static-website --404-document index.html --index-document index.html

# Step 5: Set Public Access Permissions for the $web Container using the connection string
Write-Output "Setting access level for the '$frontendContainerName' container to 'container' (public read access)..."
az storage container set-permission --name '$web' --connection-string $storageConnectionString --public-access container

Write-Output "Frontend container '$frontendContainerName' created successfully and static website hosting enabled!"

# Step 6: Build the Vite App Using Production Environment
Write-Output "Building the Vite app for production deployment..."
if (Test-Path -Path "./package.json") {
    npm install
    npm run build -- --mode production
} else {
    Write-Error "package.json not found in the current directory. Ensure you are in the frontend app root."
    exit 1
}

# Step 7: Deploy the Vite Build Files to the $web Container using the connection string (with overwrite)
Write-Output "Deploying the Vite build files to the $frontendContainerName container in Azure Storage..."
az storage blob upload-batch --destination '$web' --connection-string $storageConnectionString --source $frontendBuildFolder --overwrite

Write-Output "Vite React app successfully deployed to https://$storageAccountName.z16.web.core.windows.net"