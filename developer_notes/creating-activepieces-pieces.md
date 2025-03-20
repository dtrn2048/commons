# Guide to Creating New Pieces in Activepieces

This guide walks through the process of creating new pieces for Activepieces, which allows you to extend the platform's functionality by integrating with various services and APIs.

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Pieces](#understanding-pieces)
3. [Setting Up Development Environment](#setting-up-development-environment)
4. [Creating a New Piece](#creating-a-new-piece)
5. [Adding Authentication](#adding-authentication)
6. [Creating Actions](#creating-actions)
7. [Creating Triggers](#creating-triggers)
8. [Testing Your Piece](#testing-your-piece)
9. [Publishing Your Piece](#publishing-your-piece)
10. [Best Practices](#best-practices)

## Introduction

Activepieces is a no-code automation platform that allows users to create workflows by connecting different services together. Pieces are the building blocks of Activepieces that represent integrations with external services or utilities.

## Understanding Pieces

A piece in Activepieces consists of:

- **Piece Definition**: The main configuration of the piece, including name, logo, and authentication
- **Actions**: Functions that perform operations (e.g., sending data, creating records)
- **Triggers**: Event listeners that start flows when specific events happen
- **Authentication**: Methods for securely connecting to external services

## Setting Up Development Environment

Before creating a piece, you need to set up your development environment:

1. Install Dependencies
2. Setup the environment with 
```bash
node tools/setup-dev.js
```
3. Start the environment (This command will start activepieces with sqlite3 and in memory queue.)
```bash
npm start
```
By default, the development setup only builds specific pieces.Open the file packages/server/api/.env and add comma-separated list of pieces to make available.
4. Go to localhost:4200 on your web browser and sign in with these details: Email: dev@ap.com Password: 12345678

## Creating a New Piece

To create a new piece, use the Activepieces CLI:

```bash
npm run cli pieces create
```

You'll be prompted for:
- **Piece Name**: A unique identifier for your piece
- **Package Name**: The npm package name (defaults to @activepieces/piece-[name])
- **Piece Type**: 'community' for shared pieces or 'custom' for private pieces

This creates a basic piece structure at `packages/pieces/[type]/[name]/` with the following files:

```
packages/pieces/[type]/[name]/
├── src/
│   ├── index.ts        # Main piece definition
│   └── lib/
│       ├── actions/    # Directory for actions
│       └── triggers/   # Directory for triggers
├── package.json
└── tsconfig.json
```

The generated `src/index.ts` will contain a basic piece definition:

```typescript
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

export const yourPiece = createPiece({
  displayName: 'Your Piece',
  logoUrl: 'https://cdn.activepieces.com/pieces/your-piece.png',
  auth: PieceAuth.None(),
  authors: [],
  actions: [],
  triggers: [],
});
```

## Adding Authentication

Most pieces require authentication to interact with external services. Activepieces supports several authentication methods:

1. Edit your piece's `src/index.ts` file to add authentication:

```typescript
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';

// For API key authentication
export const yourPieceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your API key from the service'
});

// For OAuth2 authentication
export const yourPieceAuth = PieceAuth.OAuth2({
  displayName: 'Connect Your Service',
  required: true,
  authUrl: 'https://service.com/oauth2/authorize',
  tokenUrl: 'https://service.com/oauth2/token',
  scope: ['read', 'write'],
});

// For custom authentication with multiple fields
export const yourPieceAuth = PieceAuth.CustomAuth({
  description: 'Authentication description',
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    // Validate the authentication
    try {
      // Test API call with authentication
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
});

export const yourPiece = createPiece({
  displayName: 'Your Piece',
  logoUrl: 'https://cdn.activepieces.com/pieces/your-piece.png',
  auth: yourPieceAuth,  // Add authentication to your piece
  authors: ['your-name'],
  actions: [],
  triggers: [],
});
```

## Creating Actions

Actions are functions that perform operations in the external service. To create an action:

1. Use the CLI to generate a new action:

```bash
npm run cli actions create
```

You'll be prompted for:
- **Piece Folder Name**: The name of your piece
- **Action Display Name**: A user-friendly name for the action
- **Action Description**: A brief description of what the action does

This creates a new file in `packages/pieces/[type]/[name]/src/lib/actions/`.

2. Implement your action in the generated file:

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { yourPieceAuth } from '../..';

export const yourAction = createAction({
  name: 'action_name',  // Unique identifier for this action
  auth: yourPieceAuth,  // Reference to your auth
  displayName: 'Your Action',
  description: 'Description of what your action does',
  props: {
    // Define input properties for your action
    field1: Property.ShortText({
      displayName: 'Field Name',
      description: 'Description of this field',
      required: true,
    }),
    field2: Property.Number({
      displayName: 'Number Field',
      description: 'A numeric input',
      required: false,
    }),
    field3: Property.Dropdown({
      displayName: 'Select Option',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        // Dynamic options based on API call
        return {
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ],
        };
      },
    }),
  },
  async run(context) {
    // Extract auth and props values
    const { auth, propsValue } = context;
    
    // Implement your action logic
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.service.com/endpoint',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        field1: propsValue.field1,
        field2: propsValue.field2,
        field3: propsValue.field3,
      },
    });
    
    // Return the response data
    return response.body;
  },
});
```

3. Add the action to your piece definition in `src/index.ts`:

```typescript
import { yourAction } from './lib/actions/your-action';

export const yourPiece = createPiece({
  // ... other properties
  actions: [yourAction],
  // ...
});
```

## Creating Triggers

Triggers are event listeners that start flows when specific events happen. Activepieces supports two types of triggers:

1. **Polling Triggers**: Periodically check for new events
2. **Webhook Triggers**: Receive real-time notifications via webhooks

To create a trigger:

1. Use the CLI to generate a new trigger:

```bash
npm run cli triggers create
```

You'll be prompted for:
- **Piece Folder Name**: The name of your piece
- **Trigger Display Name**: A user-friendly name for the trigger
- **Trigger Description**: A brief description of what the trigger does
- **Trigger Technique**: Choose between 'polling' or 'webhook'

This creates a new file in `packages/pieces/[type]/[name]/src/lib/triggers/`.

2. For a polling trigger, implement it like this:

```typescript
import { 
  TriggerStrategy, 
  createTrigger 
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  httpClient,
  pollingHelper
} from '@activepieces/pieces-common';
import { yourPieceAuth } from '../..';

// Define polling logic
const polling: Polling = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    // Make API call to get new items since last poll
    const request = {
      method: HttpMethod.GET,
      url: 'https://api.service.com/items',
      headers: {
        authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: {
        since: new Date(lastFetchEpochMS).toISOString()
      }
    };
    
    const response = await httpClient.sendRequest(request);
    
    // Return items with timestamps for deduplication
    return response.body.items.map(item => ({
      epochMilliSeconds: new Date(item.created_at).getTime(),
      data: item,
    }));
  },
};

export const newItemTrigger = createTrigger({
  name: 'new_item',
  displayName: 'New Item',
  description: 'Triggers when a new item is created',
  auth: yourPieceAuth,
  props: {
    // Define any trigger properties here
  },
  type: TriggerStrategy.POLLING,
  
  // Use polling helper methods
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  sampleData: {
    // Sample data for testing
    id: '123',
    name: 'Sample Item',
    created_at: '2023-01-01T12:00:00Z'
  }
});
```

3. For a webhook trigger, implement it like this:

```typescript
import { 
  TriggerStrategy, 
  WebhookHandlerResponse,
  createTrigger 
} from '@activepieces/pieces-framework';
import { yourPieceAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const webhookTrigger = createTrigger({
  name: 'webhook_event',
  displayName: 'Webhook Event',
  description: 'Triggers when an event is received via webhook',
  auth: yourPieceAuth,
  props: {
    // Define any trigger properties here
  },
  type: TriggerStrategy.WEBHOOK,
  
  // Set up webhook when trigger is enabled
  async onEnable(context) {
    // Register webhook with external service
    const { webhookUrl, auth } = context;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.service.com/webhooks',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
      },
      body: {
        url: webhookUrl,
        events: ['item.created'],
      },
    });
    
    // Store webhook ID for later deletion
    await context.store.put('webhookId', response.body.id);
  },
  
  // Remove webhook when trigger is disabled
  async onDisable(context) {
    const webhookId = await context.store.get('webhookId');
    
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.service.com/webhooks/${webhookId}`,
        headers: {
          'Authorization': `Bearer ${context.auth.access_token}`,
        },
      });
    }
  },
  
  // Process incoming webhook payloads
  async run(context): Promise<WebhookHandlerResponse> {
    // Extract and return the webhook payload
    const payloadBody = context.payload.body;
    
    // Verify webhook signature if needed
    
    // Return the event data
    return {
      event: payloadBody.event_type,
      body: payloadBody,
    };
  },
  
  // Sample data for testing
  sampleData: {
    event_type: 'item.created',
    item: {
      id: '123',
      name: 'Sample Item',
      created_at: '2023-01-01T12:00:00Z'
    }
  }
});
```

4. Add the trigger to your piece definition in `src/index.ts`:

```typescript
import { newItemTrigger } from './lib/triggers/new-item-trigger';

export const yourPiece = createPiece({
  // ... other properties
  triggers: [newItemTrigger],
  // ...
});
```

## Testing Your Piece

To test your piece in the Activepieces platform:

1. Add your piece to the development environment by modifying `packages/server/api/.env`:

```
AP_DEV_PIECES=piece1,piece2,your-piece-name
```

2. Restart the backend server to rebuild the piece.
3. Refresh the frontend to see your piece in the builder.
4. Test your actions and triggers using the flow builder.

You can also use:
```bash
AP_DEV_PIECES=google-sheets,cal-com,piece2,your-piece-name npm start
```

## Publishing Your Piece

Once your piece is ready:

1. For a community piece, submit a pull request to the Activepieces repository.
2. For a private piece, you can publish it to your own npm registry or use it directly in your Activepieces instance.

## Best Practices

- **Error Handling**: Implement proper error handling in your actions and triggers.
- **Rate Limiting**: Respect rate limits of the APIs you're integrating with.
- **Documentation**: Provide clear descriptions for your piece, actions, and triggers.
- **Testing**: Test your piece thoroughly with different inputs and scenarios.
- **Versioning**: Follow semantic versioning for your piece.
- **Security**: Never hardcode sensitive information like API keys.

## Available Property Types

Activepieces provides various property types to define inputs for your actions and triggers:

- `Property.ShortText`: For short text input
- `Property.LongText`: For multi-line text input
- `Property.Number`: For numeric input
- `Property.Checkbox`: For boolean input
- `Property.Dropdown`: For selection from predefined options
- `Property.MultiSelectDropdown`: For selecting multiple options
- `Property.StaticDropdown`: For selection from static options
- `Property.StaticMultiSelectDropdown`: For selecting multiple static options
- `Property.DateTime`: For date and time input
- `Property.File`: For file uploads
- `Property.Json`: For JSON input
- `Property.Object`: For complex object input
- `Property.Array`: For array input
- `Property.DynamicProperties`: For dynamic properties

Each property type has its own configuration options to customize the input experience.

---

By following this guide, you can create and contribute pieces to the Activepieces platform, extending its functionality and connecting it to various services and APIs.
