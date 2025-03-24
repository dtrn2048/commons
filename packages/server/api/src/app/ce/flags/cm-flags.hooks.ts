import { ApEdition, ApFlagId, isNil } from '@activepieces/shared'
import { FlagsServiceHooks } from '../../flags/flags.hooks'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { platformUtils } from '../../platform/platform.utils'

export const cmFlagsHooks: FlagsServiceHooks = {
    async modify({ flags, request }) {
        const modifiedFlags: Record<string, string | boolean | number | Record<string, unknown>> = { ...flags }
        
        // Get platform ID from the request
        const platformId = await platformUtils.getPlatformIdForRequest(request)
        
        // If there's no platform ID, just return the original flags
        if (isNil(platformId)) {
            return modifiedFlags
        }
        
        // Get the platform
        const platform = await platformService.getOneOrThrow(platformId)
        
        // In CE, we want to enable pieces management regardless of the platform setting
        // This overrides the enterprise restriction while keeping other flags intact
        modifiedFlags['MANAGE_PIECES_ENABLED'] = true
        
        // Return the modified flags
        return modifiedFlags
    },
}
