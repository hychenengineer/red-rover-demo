@description('Environment name (e.g. dev, prod)')
param environment string = 'prod'

@description('Primary Azure region for all Red Rover resources')
param location string = resourceGroup().location

@description('Administrator login name for Azure SQL Server')
param sqlAdminLogin string = 'redroveradmin'

@description('Administrator password for Azure SQL Server')
@secure()
param sqlAdminPassword string

var suffix = uniqueString(resourceGroup().id)
var apiName = 'app-redrover-api-${suffix}'
var funcName = 'func-sub-dispatcher-${suffix}'
var signalRName = 'sig-redrover-${suffix}'
var serviceBusName = 'sb-redrover-${suffix}'
var sqlServerName = 'sql-redrover-${suffix}'
var sqlDbName = 'redrover-k12'
var storageName = 'stredrover${take(suffix, 12)}'

// 1. Storage Account (Used by Azure Functions & Personnel Document Vault)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

// Blob Container for Document Vault (Video #5)
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource vaultContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'personnel-credentials'
  properties: {
    publicAccess: 'None'
  }
}

// 2. Azure SignalR Service (Real-time WebSocket fan-out for Live Absence Boards)
resource signalR 'Microsoft.SignalRService/signalR@2023-02-01' = {
  name: signalRName
  location: location
  sku: {
    name: 'Standard_S1'
    capacity: 1
  }
  properties: {
    features: [
      {
        flag: 'ServiceMode'
        value: 'Default'
      }
    ]
    cors: {
      allowedOrigins: [
        '*'
      ]
    }
  }
}

// 3. Azure Service Bus (Asynchronous Queue decoupling API from 6:00 AM burst)
resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: serviceBusName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource subNotificationQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'sub-notification-queue'
  properties: {
    lockDuration: 'PT1M'
    maxDeliveryCount: 10
    enablePartitioning: true
  }
}

// 4. Azure SQL Database (Relational storage with row version concurrency tokens)
resource sqlServer 'Microsoft.Sql/servers@2022-11-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-11-01-preview' = {
  parent: sqlServer
  name: sqlDbName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
    capacity: 50
  }
}

// 5. Azure App Service Plan for Core REST API (Always-On dedicated instances to prevent cold starts)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-redrover-api'
  location: location
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// 6. Core REST API App Service
resource apiApp 'Microsoft.Web/sites@2022-09-01' = {
  name: apiName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      appSettings: [
        {
          name: 'ConnectionStrings__DefaultConnection'
          value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDbName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
        {
          name: 'Azure__SignalR__ConnectionString'
          value: listKeys(signalR.id, signalR.apiVersion).primaryConnectionString
        }
      ]
    }
  }
}

// 7. Consumption Plan for SubNotificationDispatcher (Serverless Burst Worker)
resource funcConsumptionPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: 'plan-redrover-burst'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {}
}

// 8. Azure Function: SubNotificationDispatcher
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: funcName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: funcConsumptionPlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'dotnet-isolated'
        }
        {
          name: 'ServiceBusConnection'
          value: listKeys(resourceId('Microsoft.ServiceBus/namespaces/authorizationRules', serviceBusNamespace.name, 'RootManageSharedAccessKey'), '2022-10-01-preview').primaryConnectionString
        }
      ]
    }
  }
}

output apiEndpoint string = 'https://${apiApp.properties.defaultHostName}'
output functionEndpoint string = 'https://${functionApp.properties.defaultHostName}'
output signalREndpoint string = 'https://${signalR.properties.hostName}'
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
