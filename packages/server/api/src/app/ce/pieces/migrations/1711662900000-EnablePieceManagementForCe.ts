import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { ApEdition } from '@activepieces/shared'

export class EnablePieceManagementForCe1711662900000 implements MigrationInterface {
    name = 'EnablePieceManagementForCe1711662900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Only run this migration for CE edition
        if (system.getEdition() === ApEdition.COMMUNITY) {
            // Update all platforms to enable managePiecesEnabled flag
            await queryRunner.query(`
                UPDATE platform
                SET "managePiecesEnabled" = true
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We don't need to roll back this change as it's a feature enhancement
    }
}
