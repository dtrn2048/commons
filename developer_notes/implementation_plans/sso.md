# Single Sign-On (SSO) Implementation Plan

## Overview
This document outlines a plan to rebuild the Single Sign-On (SSO) feature from ActivePieces Enterprise Edition as identified in the enterprise features analysis. The SSO feature provides enterprise authentication methods including support for multiple identity providers and JWT-based SSO for embedded use cases.

## Feature Analysis

### Core Functionality
1. **Identity Provider Integration** - Support for multiple SSO providers (Google, GitHub, SAML)
2. **Authentication Flow** - Secure login and token exchange process
3. **User Provisioning** - Automatic user creation and attribute mapping
4. **Domain Enforcement** - Option to enforce SSO for specific email domains
5. **Session Management** - Secure handling of authenticated sessions

### Key Components

#### 1. Authentication Provider Schema
The core of the SSO system is built around the federated authentication modules found in the enterprise codebase:

- Authentication provider definitions
- OAuth2 and SAML protocol implementations
- Token validation and verification
- User identity mapping

#### 2. Authentication Flow
The SSO implementation includes these key flows:

- Initial redirection to identity provider
- Token/code exchange
- ID token verification and validation
- User provisioning or authentication
- Session creation

#### 3. Service Layer
The SSO feature is implemented through several services:

- `federated-authn-service.ts` - Core authentication functionality
- Provider-specific implementations (e.g., `google-authn-provider.ts`)
- Integration with the main authentication system

#### 4. API Endpoints
The SSO feature exposes endpoints for:

- Initiating the login process
- Handling authentication callbacks
- Token validation and exchange

#### 5. Admin Configuration
The SSO feature includes configuration options in the admin console:

- Identity provider configuration
- Domain enforcement settings
- User attribute mapping
- Optional disabling of password authentication

## Implementation Strategy

### 1. Federated Authentication Framework

Build a modular federated authentication framework that supports multiple providers:

1. Implement the base federated authentication module:
   - Create `federated-authn-module.ts` to register routes and controllers
   - Define core interfaces for authentication providers
   - Implement shared functionality for session handling

2. Create provider-specific implementations:
   - Google OAuth2 provider
   - GitHub OAuth2 provider
   - SAML provider for enterprise IdP integration

3. Implement the authentication flow:
   - Login URL generation
   - Token exchange and validation
   - User identity extraction

### 2. Database Schema

Extend the existing database schema to support SSO configurations:

1. Update the platform entity to include SSO configuration:
   - OAuth2 provider settings (client IDs, secrets)
   - SAML provider settings (metadata, certificates)
   - Domain enforcement configuration

2. User entity extensions:
   - Identity provider tracking
   - External user ID mapping
   - SSO-specific attributes

### 3. Authentication Service Integration

Integrate the SSO feature with the core authentication system:

1. Extend the authentication service with federated authentication support:
   - Implement `federatedAuthn` method
   - Handle user provisioning for new SSO users
   - Link existing users with SSO identities

2. Implement session management for SSO users:
   - Generate and validate tokens
   - Handle session lifetime and refresh
   - Support SSO logout

### 4. Admin Configuration Interface

Create API endpoints for SSO configuration management:

1. Implement configuration endpoints:
   - Get/set OAuth2 provider settings
   - Upload/manage SAML metadata and certificates
   - Configure domain enforcement rules

2. Apply proper authorization to these endpoints:
   - Restrict to platform administrators
   - Add validation for configuration parameters

### 5. Domain Enforcement

Implement domain-based SSO enforcement:

1. Create middleware to check email domains:
   - Intercept login attempts
   - Check domain against enforcement rules
   - Redirect to appropriate SSO provider

2. Add configuration options:
   - Enable/disable password authentication
   - Specify domains for SSO enforcement

## Implementation Plan

### Phase 1: Core Authentication Framework (1 week)

#### Backend Implementation

1. **Base Authentication Module**

```typescript
// federated-authn-module.ts
import { AppSystemProp, networkUtils } from '@activepieces/server-shared'
import { 
  ALL_PRINCIPAL_TYPES, 
  ClaimTokenRequest, 
  ThirdPartyAuthnProviderEnum 
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { eventsHooks } from '../../../helper/application-events'
import { system } from '../../../helper/system/system'
import { platformUtils } from '../../../platform/platform.utils'
import { federatedAuthnService } from './federated-authn-service'

export const federatedAuthModule: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(federatedAuthnController, {
    prefix: '/v1/authn/federated',
  })
}

const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
  app.get('/login', LoginRequestSchema, async (req) => {
    const platformId = await platformUtils.getPlatformIdForRequest(req)
    return federatedAuthnService(req.log).login({
      platformId: platformId ?? undefined,
      providerName: req.query.providerName,
    })
  })

  app.post('/claim', ClaimTokenRequestSchema, async (req) => {
    const platformId = await platformUtils.getPlatformIdForRequest(req)
    const response = await federatedAuthnService(req.log).claim({
      platformId: platformId ?? undefined,
      code: req.body.code,
      providerName: req.body.providerName,
    })
    
    // Track the sign-in event
    eventsHooks.get(req.log).sendUserEvent({
      platformId: response.platformId!,
      userId: response.id,
      projectId: response.projectId,
      ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
    }, {
      action: 'USER_SIGNED_UP',
      data: {
        source: 'sso',
        provider: req.body.providerName,
      },
    })
    
    return response
  })
}

const LoginRequestSchema = {
  config: {
    allowedPrincipals: ALL_PRINCIPAL_TYPES,
  },
  schema: {
    querystring: Type.Object({
      providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
    }),
  },
}

const ClaimTokenRequestSchema = {
  config: {
    allowedPrincipals: ALL_PRINCIPAL_TYPES,
  },
  schema: {
    body: ClaimTokenRequest,
  },
}
```

2. **Authentication Service**

```typescript
// federated-authn-service.ts
import { AppSystemProp } from '@activepieces/server-shared'
import { 
  assertNotNullOrUndefined, 
  AuthenticationResponse,
  FederatedAuthnLoginResponse,
  isNil,
  ThirdPartyAuthnProviderEnum,
  UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { domainHelper } from '../../custom-domains/domain-helper'
import { googleAuthnProvider } from './google-authn-provider'
import { githubAuthnProvider } from './github-authn-provider'
import { samlAuthnProvider } from './saml-authn-provider'

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
  async login({
    platformId,
    providerName,
  }: LoginParams): Promise<FederatedAuthnLoginResponse> {
    switch (providerName) {
      case ThirdPartyAuthnProviderEnum.GOOGLE: {
        const { clientId } = await getGoogleClientIdAndSecret(platformId)
        const loginUrl = await googleAuthnProvider(log).getLoginUrl({
          clientId,
          platformId,
        })
        return { loginUrl }
      }
      case ThirdPartyAuthnProviderEnum.GITHUB: {
        const { clientId } = await getGithubClientIdAndSecret(platformId)
        const loginUrl = await githubAuthnProvider(log).getLoginUrl({
          clientId,
          platformId,
        })
        return { loginUrl }
      }
      case ThirdPartyAuthnProviderEnum.SAML: {
        return await samlAuthnProvider(log).getLoginUrl({
          platformId,
        })
      }
      default:
        throw new Error(`Unsupported provider: ${providerName}`)
    }
  },

  async claim({
    platformId,
    code,
    providerName,
  }: ClaimParams): Promise<AuthenticationResponse> {
    switch (providerName) {
      case ThirdPartyAuthnProviderEnum.GOOGLE: {
        const { clientId, clientSecret } = await getGoogleClientIdAndSecret(platformId)
        const idToken = await googleAuthnProvider(log).authenticate({
          clientId,
          clientSecret,
          authorizationCode: code,
          platformId,
        })

        return authenticationService(log).federatedAuthn({
          email: idToken.email,
          firstName: idToken.firstName ?? 'Unknown',
          lastName: idToken.lastName ?? 'User',
          trackEvents: true,
          newsLetter: false,
          provider: UserIdentityProvider.GOOGLE,
          predefinedPlatformId: platformId ?? null,
        })
      }
      case ThirdPartyAuthnProviderEnum.GITHUB: {
        const { clientId, clientSecret } = await getGithubClientIdAndSecret(platformId)
        const idToken = await githubAuthnProvider(log).authenticate({
          clientId,
          clientSecret,
          authorizationCode: code,
          platformId,
        })

        return authenticationService(log).federatedAuthn({
          email: idToken.email,
          firstName: idToken.firstName ?? 'GitHub',
          lastName: idToken.lastName ?? 'User',
          trackEvents: true,
          newsLetter: false,
          provider: UserIdentityProvider.GITHUB,
          predefinedPlatformId: platformId ?? null,
        })
      }
      case ThirdPartyAuthnProviderEnum.SAML: {
        const idToken = await samlAuthnProvider(log).authenticate({
          samlResponse: code,
          platformId,
        })

        return authenticationService(log).federatedAuthn({
          email: idToken.email,
          firstName: idToken.firstName ?? 'SAML',
          lastName: idToken.lastName ?? 'User',
          trackEvents: true,
          newsLetter: false,
          provider: UserIdentityProvider.SAML,
          predefinedPlatformId: platformId ?? null,
        })
      }
      default:
        throw new Error(`Unsupported provider: ${providerName}`)
    }
  },
  
  async getThirdPartyRedirectUrl(
    platformId: string | undefined,
  ): Promise<string> {
    return domainHelper.getInternalUrl({
      path: '/redirect',
      platformId,
    })
  },
})

async function getGoogleClientIdAndSecret(platformId: string | undefined) {
  if (isNil(platformId)) {
    return {
      clientId: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_ID),
      clientSecret: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_SECRET),
    }
  }
  const platform = await platformService.getOneOrThrow(platformId)
  const clientInformation = platform.federatedAuthProviders?.google
  assertNotNullOrUndefined(clientInformation, 'Google client information is not defined')
  return {
    clientId: clientInformation.clientId,
    clientSecret: clientInformation.clientSecret,
  }
}

async function getGithubClientIdAndSecret(platformId: string | undefined) {
  if (isNil(platformId)) {
    return {
      clientId: system.getOrThrow(AppSystemProp.GITHUB_CLIENT_ID),
      clientSecret: system.getOrThrow(AppSystemProp.GITHUB_CLIENT_SECRET),
    }
  }
  const platform = await platformService.getOneOrThrow(platformId)
  const clientInformation = platform.federatedAuthProviders?.github
  assertNotNullOrUndefined(clientInformation, 'GitHub client information is not defined')
  return {
    clientId: clientInformation.clientId,
    clientSecret: clientInformation.clientSecret,
  }
}

type LoginParams = {
  platformId: string | undefined
  providerName: ThirdPartyAuthnProviderEnum
}

type ClaimParams = {
  platformId: string | undefined
  code: string
  providerName: ThirdPartyAuthnProviderEnum
}
```

3. **Google Authentication Provider**

```typescript
// google-authn-provider.ts
import { assertNotEqual } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import jwksClient from 'jwks-rsa'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { federatedAuthnService } from './federated-authn-service'

const JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs'

const keyLoader = jwksClient({
  rateLimit: true,
  cache: true,
  jwksUri: JWKS_URI,
})

export const googleAuthnProvider = (log: FastifyBaseLogger) => ({
  async getLoginUrl(params: GetLoginUrlParams): Promise<string> {
    const { clientId, platformId } = params
    const loginUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    loginUrl.searchParams.set('client_id', clientId)
    loginUrl.searchParams.set(
      'redirect_uri',
      await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
    )
    loginUrl.searchParams.set('scope', 'email profile')
    loginUrl.searchParams.set('response_type', 'code')

    return loginUrl.href
  },

  async authenticate(
    params: AuthenticateParams,
  ): Promise<FederatedAuthnIdToken> {
    const { clientId, clientSecret, authorizationCode, platformId } = params
    const idToken = await exchangeCodeForIdToken(
      log,
      platformId,
      clientId,
      clientSecret,
      authorizationCode,
    )
    return verifyIdToken(clientId, idToken)
  },
})

const exchangeCodeForIdToken = async (
  log: FastifyBaseLogger,
  platformId: string | undefined,
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<string> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
      grant_type: 'authorization_code',
    }),
  })

  const { id_token: idToken } = await response.json()
  return idToken
}

const verifyIdToken = async (
  clientId: string,
  idToken: string,
): Promise<FederatedAuthnIdToken> => {
  const { header } = jwtUtils.decode({ jwt: idToken })
  const signingKey = await keyLoader.getSigningKey(header.kid)
  const publicKey = signingKey.getPublicKey()

  const payload = await jwtUtils.decodeAndVerify<IdTokenPayloadRaw>({
    jwt: idToken,
    key: publicKey,
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
    algorithm: JwtSignAlgorithm.RS256,
    audience: clientId,
  })

  assertNotEqual(payload.email_verified, false, 'payload.email_verified', 'Email is not verified')
  return {
    email: payload.email,
    firstName: payload.given_name,
    lastName: payload.family_name,
  }
}

type IdTokenPayloadRaw = {
  email: string
  email_verified: boolean
  given_name: string
  family_name: string
  sub: string
  aud: string
  iss: string
}

type GetLoginUrlParams = {
  clientId: string
  platformId: string | undefined
}

type AuthenticateParams = {
  platformId: string | undefined
  clientId: string
  clientSecret: string
  authorizationCode: string
}

export type FederatedAuthnIdToken = {
  email: string
  firstName: string | undefined
  lastName: string | undefined
}
```

#### Database Schema Extensions

1. **Platform Entity Extension**

```typescript
// Update the platform entity to include SSO configuration
export interface FederatedAuthProviders {
  google?: {
    clientId: string
    clientSecret: string
    enabled: boolean
  }
  github?: {
    clientId: string
    clientSecret: string
    enabled: boolean
  }
  saml?: {
    metadata: string
    certificate: string
    enabled: boolean
  }
  enforced: boolean
  enforcedDomains: string[]
  allowPasswordLogin: boolean
}

// Add to the platform entity
@Entity()
export class PlatformEntity {
  // ... existing fields

  @Column({ type: 'jsonb', nullable: true })
  federatedAuthProviders: FederatedAuthProviders

  // ... other fields
}
```

2. **User Entity Extension**

```typescript
// Add identity provider information to the user entity
@Entity()
export class UserEntity {
  // ... existing fields

  @Column({ nullable: true })
  identityProvider: UserIdentityProvider

  @Column({ nullable: true })
  externalUserId: string

  // ... other fields
}
```

#### Authentication Service Integration

1. **Extension to Authentication Service**

```typescript
// Add federatedAuthn method to authentication service
export const authenticationService = (logger: FastifyBaseLogger) => ({
  // ... existing methods

  async federatedAuthn(params: FederatedAuthnParams): Promise<AuthenticationResponse> {
    const { email, firstName, lastName, provider, predefinedPlatformId } = params

    // Check if the user exists
    let user = await userService.getByEmail({ email })
    
    if (!user) {
      // Create a new user
      user = await userService.create({
        email,
        firstName,
        lastName,
        password: null, // No password for SSO users
        status: UserStatus.ACTIVE,
        identityProvider: provider,
        trackEvents: params.trackEvents,
        newsLetter: params.newsLetter,
      })
    } else if (user.identityProvider !== provider) {
      // Update the identity provider if it changed
      user = await userService.update({
        id: user.id,
        identityProvider: provider,
      })
    }

    // Generate tokens
    const { token, refreshToken } = tokenUtils.generateAuthTokens({
      id: user.id,
      type: PrincipalType.USER,
    })

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      trackEvents: user.trackEvents,
      newsLetter: user.newsLetter,
      token,
      refreshToken,
      platformId: predefinedPlatformId,
      projectId: null, // Will be set if the user has a default project
      verified: true, // SSO users are considered verified
    }
  },
})

type FederatedAuthnParams = {
  email: string
  firstName: string
  lastName: string
  provider: UserIdentityProvider
  predefinedPlatformId: string | null
  trackEvents: boolean
  newsLetter: boolean
}
```

### Phase 2: Provider Implementations (1 week)

#### GitHub Provider Implementation

```typescript
// github-authn-provider.ts
import { FastifyBaseLogger } from 'fastify'
import { federatedAuthnService } from './federated-authn-service'
import { FederatedAuthnIdToken } from './google-authn-provider'

export const githubAuthnProvider = (log: FastifyBaseLogger) => ({
  async getLoginUrl(params: GetLoginUrlParams): Promise<string> {
    const { clientId, platformId } = params
    const loginUrl = new URL('https://github.com/login/oauth/authorize')
    loginUrl.searchParams.set('client_id', clientId)
    loginUrl.searchParams.set(
      'redirect_uri',
      await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
    )
    loginUrl.searchParams.set('scope', 'user:email')

    return loginUrl.href
  },

  async authenticate(
    params: AuthenticateParams,
  ): Promise<FederatedAuthnIdToken> {
    const { clientId, clientSecret, authorizationCode } = params
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
      }),
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })

    const userData = await userResponse.json()
    
    // Get user email (may not be public in profile)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    })

    const emails = await emailResponse.json()
    const primaryEmail = emails.find((email: any) => email.primary)?.email || emails[0]?.email

    if (!primaryEmail) {
      throw new Error('No email found for GitHub user')
    }

    return {
      email: primaryEmail,
      firstName: userData.name ? userData.name.split(' ')[0] : undefined,
      lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : undefined,
    }
  },
})

type GetLoginUrlParams = {
  clientId: string
  platformId: string | undefined
}

type AuthenticateParams = {
  platformId: string | undefined
  clientId: string
  clientSecret: string
  authorizationCode: string
}
```

#### SAML Provider Implementation

```typescript
// saml-authn-provider.ts
import { FastifyBaseLogger } from 'fastify'
import { FederatedAuthnIdToken } from './google-authn-provider'
import * as saml from 'samlify'
import { platformService } from '../../../platform/platform.service'

export const samlAuthnProvider = (log: FastifyBaseLogger) => ({
  async getLoginUrl({
    platformId,
  }: GetLoginUrlParams): Promise<{ loginUrl: string }> {
    if (!platformId) {
      throw new Error('Platform ID is required for SAML authentication')
    }

    const platform = await platformService.getOneOrThrow(platformId)
    const samlConfig = platform.federatedAuthProviders?.saml
    
    if (!samlConfig || !samlConfig.metadata || !samlConfig.enabled) {
      throw new Error('SAML configuration is not available for this platform')
    }

    // Create service provider
    const sp = saml.ServiceProvider({
      entityID: 'activepieces',
      assertionConsumerService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: `${process.env.AP_FRONTEND_URL}/api/v1/authn/federated/saml/callback`,
        },
      ],
    })

    // Create identity provider from metadata
    const idp = saml.IdentityProvider({
      metadata: samlConfig.metadata,
    })

    // Create login request
    const { context } = sp.createLoginRequest(idp, 'redirect')
    
    return {
      loginUrl: context,
    }
  },

  async authenticate({
    samlResponse,
    platformId,
  }: AuthenticateParams): Promise<FederatedAuthnIdToken> {
    if (!platformId) {
      throw new Error('Platform ID is required for SAML authentication')
    }

    const platform = await platformService.getOneOrThrow(platformId)
    const samlConfig = platform.federatedAuthProviders?.saml
    
    if (!samlConfig || !samlConfig.metadata || !samlConfig.certificate || !samlConfig.enabled) {
      throw new Error('SAML configuration is not available for this platform')
    }

    // Create service provider
    const sp = saml.ServiceProvider({
      entityID: 'activepieces',
      assertionConsumerService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: `${process.env.AP_FRONTEND_URL}/api/v1/authn/federated/saml/callback`,
        },
      ],
    })

    // Create identity provider from metadata
    const idp = saml.IdentityProvider({
      metadata: samlConfig.metadata,
      signingCert: samlConfig.certificate,
    })

    // Parse and validate the SAML response
    const parseResult = await sp.parseLoginResponse(idp, 'post', { body: { SAMLResponse: samlResponse } })
    
    // Extract user information from SAML attributes
    const attributes = parseResult.extract.attributes
    
    return {
      email: attributes.email || attributes.emailAddress || '',
      firstName: attributes.firstName || attributes.givenName || '',
      lastName: attributes.lastName || attributes.surname || '',
    }
  },
})

type GetLoginUrlParams = {
  platformId: string | undefined
}

type AuthenticateParams = {
  platformId: string | undefined
  samlResponse: string
}
```

### Phase 3: Domain Enforcement & Admin UI (1 week)

#### Domain Enforcement Middleware

```typescript
// sso-enforcement-middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { platformService } from '../../../platform/platform.service'

export const ssoEnforcementMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Skip for non-login requests
  if (request.url !== '/v1/authentication/sign-in' && request.url !== '/v1/authentication/sign-up') {
    return
  }

  // Get email from request body
  const email = request.body?.email
  if (!email) {
    return
  }

  // Extract domain from email
  const domain = email.split('@')[1]
  if (!domain) {
    return
  }

  // Check if any platform enforces SSO for this domain
  const platform = await platformService.findSsoEnforcementPlatform(domain)
  if (!platform) {
    return
  }

  // If password login is allowed, we don't enforce SSO
  if (platform.federatedAuthProviders?.allowPasswordLogin) {
    return
  }

  // Determine which provider to use
  let providerName = 'google' // Default to Google
  if (platform.federatedAuthProviders?.github?.enabled) {
    providerName = 'github'
  }
  if (platform.federatedAuthProviders?.saml?.enabled) {
    providerName = 'saml'
  }

  // Redirect to SSO login
  return reply.status(302).send({
    redirectUrl: `/v1/authn/federated/login?providerName=${providerName}&platformId=${platform.id}`,
    enforcedSso: true,
  })
}
```

#### Admin API for SSO Configuration

```typescript
// sso-admin-controller.ts
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { platformService } from '../../../platform/platform.service'
import { platformAdminMiddleware } from '../../platform-admin.middleware'

export const ssoAdminController: FastifyPluginAsyncTypebox = async (app) => {
  // Get SSO configuration
  app.get(
    '/:platformId/sso',
    {
      schema: {
        params: Type.Object({
          platformId: Type.String(),
        }),
      },
      preHandler: [platformAdminMiddleware],
    },
    async (req) => {
      const platform = await platformService.getOneOrThrow(req.params.platformId)
      return {
        federatedAuthProviders: platform.federatedAuthProviders || {
          enforced: false,
          enforcedDomains: [],
          allowPasswordLogin: true,
        },
      }
    }
  )

  // Update SSO configuration
  app.put(
    '/:platformId/sso',
    {
      schema: {
        params: Type.Object({
          platformId: Type.String(),
        }),
        body: Type.Object({
          federatedAuthProviders: Type.Object({
            google: Type.Optional(
              Type.Object({
                clientId: Type.String(),
                clientSecret: Type.String(),
                enabled: Type.Boolean(),
              })
            ),
            github: Type.Optional(
              Type.Object({
                clientId: Type.String(),
                clientSecret: Type.String(),
                enabled: Type.Boolean(),
              })
            ),
            saml: Type.Optional(
              Type.Object({
                metadata: Type.String(),
                certificate: Type.String(),
                enabled: Type.Boolean(),
              })
            ),
            enforced: Type.Boolean(),
            enforcedDomains: Type.Array(Type.String()),
            allowPasswordLogin: Type.Boolean(),
          }),
        }),
      },
      preHandler: [platformAdminMiddleware],
    },
    async (req, reply) => {
      await platformService.update({
        id: req.params.platformId,
        federatedAuthProviders: req.body.federatedAuthProviders,
      })
      return reply.status(200).send({
        message: 'SSO configuration updated successfully',
      })
    }
  )
}
```

### Phase 4: Testing and Documentation (1 week)

1. **Unit Tests**
   - Test authentication providers
   - Test token validation
   - Test user provisioning
   - Test domain enforcement

2. **Integration Tests**
   - End-to-end SSO flow testing
   - Domain enforcement testing
   - Configuration API testing

3. **Documentation**
   - User guides for SSO setup
   - API documentation
   - Internal code documentation

## Database Schema Extensions

The SSO feature will require these database schema extensions:

```sql
-- Update platform table to include SSO configuration
ALTER TABLE platform ADD COLUMN IF NOT EXISTS "federatedAuthProviders" JSONB;

-- Add indices for domain enforcement lookups
CREATE INDEX IF NOT EXISTS "idx_platform_sso_enforced_domains" 
ON platform USING gin (("federatedAuthProviders"->'enforcedDomains'));

-- Add identity provider fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "identityProvider" VARCHAR;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "externalUserId" VARCHAR;

-- Create index for user lookups by provider
CREATE INDEX IF NOT EXISTS "idx_user_identity_provider" ON "user" ("identityProvider");
```

## JWT-Based SSO for Embedded Use Cases

In addition to standard SSO providers, the implementation includes support for JWT-based authentication for embedded scenarios:

```typescript
// jwt-authn-provider.ts
import { FastifyBaseLogger } from 'fastify'
import { jwtUtils, JwtSignAlgorithm } from '../../../helper/jwt-utils'
import { platformService } from '../../../platform/platform.service'
import { FederatedAuthnIdToken } from './google-authn-provider'

export const jwtAuthnProvider = (log: FastifyBaseLogger) => ({
  async authenticate({
    platformId,
    token,
  }: AuthenticateParams): Promise<FederatedAuthnIdToken> {
    if (!platformId) {
      throw new Error('Platform ID is required for JWT authentication')
    }

    // Get the platform configuration
    const platform = await platformService.getOneOrThrow(platformId)
    const jwtConfig = platform.federatedAuthProviders?.jwt
    
    if (!jwtConfig || !jwtConfig.publicKey || !jwtConfig.enabled) {
      throw new Error('JWT configuration is not available for this platform')
    }

    // Verify the JWT
    const payload = await jwtUtils.decodeAndVerify({
      jwt: token,
      key: jwtConfig.publicKey,
      issuer: jwtConfig.issuer,
      algorithm: JwtSignAlgorithm.RS256,
      audience: jwtConfig.audience || 'activepieces',
    })

    // Extract user information from claims
    return {
      email: payload.email,
      firstName: payload.given_name || payload.firstName,
      lastName: payload.family_name || payload.lastName,
    }
  },
})

type AuthenticateParams = {
  platformId: string | undefined
  token: string
}
```

## Security Considerations

The SSO implementation must account for these security aspects:

1. **Token Validation**
   - Proper verification of OAuth tokens and SAML responses
   - Key rotation and expiration handling
   - Protection against token replay attacks

2. **Credential Storage**
   - Secure storage of OAuth client secrets and SAML certificates
   - Encryption of sensitive configuration data
   - Access control for credential management

3. **Domain Enforcement**
   - Proper validation of email domains
   - Prevention of SSO bypass attempts
   - Handling of domain spoofing attempts

4. **Session Management**
   - Secure session creation and validation
   - Proper handling of session expiration
   - Support for single logout when applicable

## Implementation Timeline

According to the enterprise features analysis, rebuilding the SSO feature is estimated to take **3-4 weeks** for a developer familiar with the ActivePieces codebase. Here's a more detailed breakdown:

### Week 1 (Days 1-5)
- **Days 1-2**: Set up core authentication framework
  - Create base federated authentication module
  - Implement Google OAuth provider
  - Define database schema extensions
- **Days 3-5**: Extend authentication service
  - Implement federatedAuthn method
  - Add user provisioning logic
  - Integrate with existing auth system

### Week 2 (Days 6-10)
- **Days 6-7**: Implement additional providers
  - Build GitHub OAuth provider
  - Implement SAML provider
  - Create JWT provider for embedded use cases
- **Days 8-10**: Develop admin configuration API
  - Create endpoints for SSO configuration
  - Implement authorization for admin endpoints
  - Add validation for configuration parameters

### Week 3 (Days 11-15)
- **Days 11-12**: Implement domain enforcement
  - Create enforcement middleware
  - Add domain validation logic
  - Implement redirect handling
- **Days 13-15**: Begin testing and validation
  - Unit tests for providers
  - Integration testing for auth flows
  - Security review of implementation

### Week 4 (Days 16-20)
- **Days 16-18**: Finalize testing and bug fixes
  - Complete end-to-end testing
  - Fix any issues found during testing
  - Performance optimization if needed
- **Days 19-20**: Documentation and deployment
  - Create user guides for SSO setup
  - Document API endpoints
  - Prepare deployment plan

This timeline assumes:
- One developer working full-time on the feature
- Familiarity with OAuth, SAML, and JWT authentication protocols
- Understanding of the ActivePieces codebase structure
- No major architectural changes or dependencies on other features being rebuilt simultaneously

## Conclusion

This implementation plan outlines how to rebuild the Single Sign-On (SSO) feature to match the existing functionality in the enterprise edition. The approach focuses on creating a modular federated authentication framework that supports multiple providers (Google, GitHub, SAML) and JWT-based authentication for embedded use cases.

By following this plan over the estimated 3-4 week timeline, we will recreate a comprehensive SSO system that provides secure authentication options for enterprise customers, supports domain enforcement, and integrates seamlessly with the existing authentication system.

The implementation will maintain the security standards of the original enterprise feature while ensuring flexibility for supporting various identity providers. The modular approach also allows for future extensions to support additional providers as needed.
