# Function to convert a PSObject to a Hashtable
function ConvertTo-Hashtable {
    param([Parameter(ValueFromPipeline = $true)] [PSObject] $psObject)

    $hashtable = @{}
    foreach ($property in $psObject.PSObject.Properties) {
        if ($property.Value -is [PSCustomObject]) {
            $hashtable[$property.Name] = ConvertTo-Hashtable -psObject $property.Value
        }
        else {
            $hashtable[$property.Name] = $property.Value
        }
    }
    return $hashtable
}

# Define variables for your deployment
$resourceGroupName = "certiMaster-rg"
$location = "northeurope"
$storageAccountName = "certimasterstorage"
$functionAppName = "certimaster-func-app"
$functionRuntime = "node"
$functionVersion = "4"
$questionTableName = "QuestionsTable"
$userTableName = "UsersTable"
$storageConnectionString = ""

# Step 1: Load local.settings.json file and ensure it is correctly formatted
Write-Output "Loading local.settings.json..."
if (Test-Path -Path "local.settings.json") {
    # Read the JSON content and convert it to a hashtable
    $localSettings = Get-Content -Raw -Path "local.settings.json" | ConvertFrom-Json | ConvertTo-Hashtable
    if (-not $localSettings["Values"]) {
        Write-Output "Warning: 'Values' field not found in local.settings.json. Creating the 'Values' object."
        $localSettings["Values"] = @{}
    }
} else {
    Write-Error "local.settings.json not found. Please ensure the file exists in the root directory."
    exit 1
}

# Step 2: Create the Resource Group
Write-Output "Creating resource group '$resourceGroupName'..."
az group create --name $resourceGroupName --location $location

# Step 3: Create the Storage Account (if it doesn't exist)
Write-Output "Creating storage account '$storageAccountName'..."
az storage account create --name $storageAccountName --location $location --resource-group $resourceGroupName --sku Standard_LRS

# Step 4: Retrieve the storage connection string
Write-Output "Fetching storage connection string for storage account '$storageAccountName' in resource group '$resourceGroupName'..."
$storageConnectionString = (az storage account show-connection-string --resource-group $resourceGroupName --name $storageAccountName --query connectionString --output tsv)

# Validate that the connection string is not empty
if (-not $storageConnectionString) {
    Write-Error "Failed to retrieve a valid connection string for storage account '$storageAccountName'. Please check the account name and resource group."
    exit 1
}

Write-Output "Successfully retrieved the storage connection string."

# Step 5: Update the storage connection string in local.settings.json
Write-Output "Updating local.settings.json with storage connection string..."
$localSettings["Values"]["AzureWebJobsStorage"] = $storageConnectionString

# Save the updated hashtable back to local.settings.json as JSON
$localSettings | ConvertTo-Json -Depth 4 | Set-Content -Path "local.settings.json"

# Step 6: Create Storage Tables
Write-Output "Creating storage tables '$questionTableName' and '$userTableName'..."
az storage table create --name $questionTableName --connection-string $storageConnectionString
az storage table create --name $userTableName --connection-string $storageConnectionString

# Step 7: Enable Static Website Hosting on the Storage Account
Write-Output "Enabling static website hosting on the storage account..."
az storage blob service-properties update --connection-string $storageConnectionString --static-website --404-document index.html --index-document index.html

# Step 8: Set Public Access for the $web Container
Write-Output "Setting access level for the '$web' container to 'container' (public read access)..."
az storage container set-permission --name '$web' --connection-string $storageConnectionString --public-access container

# Step 9: Output the Storage Account Static Website URL
$webUrl = (az storage account show --name $storageAccountName --resource-group $resourceGroupName --query "primaryEndpoints.web" --output tsv)
Write-Output "Static website URL: $webUrl"# Function to convert a PSObject to a Hashtable
function ConvertTo-Hashtable {
    param([Parameter(ValueFromPipeline = $true)] [PSObject] $psObject)

    $hashtable = @{}
    foreach ($property in $psObject.PSObject.Properties) {
        if ($property.Value -is [PSCustomObject]) {
            $hashtable[$property.Name] = ConvertTo-Hashtable -psObject $property.Value
        }
        else {
            $hashtable[$property.Name] = $property.Value
        }
    }
    return $hashtable
}

# Define variables for your deployment
$resourceGroupName = "certiMaster-rg"
$location = "northeurope"
$storageAccountName = "certimasterstorage"
$functionAppName = "certimaster-func-app"
$functionRuntime = "node"
$functionVersion = "4"
$questionTableName = "QuestionsTable"
$userTableName = "UsersTable"
$storageConnectionString = ""

# Step 1: Load local.settings.json file and ensure it is correctly formatted
Write-Output "Loading local.settings.json..."
if (Test-Path -Path "local.settings.json") {
    # Read the JSON content and convert it to a hashtable
    $localSettings = Get-Content -Raw -Path "local.settings.json" | ConvertFrom-Json | ConvertTo-Hashtable
    if (-not $localSettings["Values"]) {
        Write-Output "Warning: 'Values' field not found in local.settings.json. Creating the 'Values' object."
        $localSettings["Values"] = @{}
    }
} else {
    Write-Error "local.settings.json not found. Please ensure the file exists in the root directory."
    exit 1
}

# Step 2: Create the Resource Group
Write-Output "Creating resource group '$resourceGroupName'..."
az group create --name $resourceGroupName --location $location

# Step 3: Create the Storage Account (if it doesn't exist)
Write-Output "Creating storage account '$storageAccountName'..."
az storage account create --name $storageAccountName --location $location --resource-group $resourceGroupName --sku Standard_LRS

# Step 4: Retrieve the storage connection string
Write-Output "Fetching storage connection string for storage account '$storageAccountName' in resource group '$resourceGroupName'..."
$storageConnectionString = (az storage account show-connection-string --resource-group $resourceGroupName --name $storageAccountName --query connectionString --output tsv)

# Validate that the connection string is not empty
if (-not $storageConnectionString) {
    Write-Error "Failed to retrieve a valid connection string for storage account '$storageAccountName'. Please check the account name and resource group."
    exit 1
}

Write-Output "Successfully retrieved the storage connection string."

# Step 5: Update the storage connection string in local.settings.json
Write-Output "Updating local.settings.json with storage connection string..."
$localSettings["Values"]["AzureWebJobsStorage"] = $storageConnectionString

# Save the updated hashtable back to local.settings.json as JSON
$localSettings | ConvertTo-Json -Depth 4 | Set-Content -Path "local.settings.json"

# Step 6: Create Storage Tables
Write-Output "Creating storage tables '$questionTableName' and '$userTableName'..."
az storage table create --name $questionTableName --connection-string $storageConnectionString
az storage table create --name $userTableName --connection-string $storageConnectionString

# Step 7: Enable Static Website Hosting on the Storage Account
Write-Output "Enabling static website hosting on the storage account..."
az storage blob service-properties update --connection-string $storageConnectionString --static-website --404-document index.html --index-document index.html

# Step 8: Set Public Access for the $web Container
Write-Output "Setting access level for the '$web' container to 'container' (public read access)..."
az storage container set-permission --name '$web' --connection-string $storageConnectionString --public-access container

# Step 9: Output the Storage Account Static Website URL
$webUrl = (az storage account show --name $storageAccountName --resource-group $resourceGroupName --query "primaryEndpoints.web" --output tsv)
Write-Output "Static website URL: $webUrl"