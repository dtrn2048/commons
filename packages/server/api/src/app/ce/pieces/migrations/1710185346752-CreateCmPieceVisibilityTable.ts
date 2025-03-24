// This is an empty placeholder file.
// The actual implementation uses the platform entity's filteredPieceNames and filteredPieceBehavior properties
// rather than creating a separate database table.

// This file exists only to prevent TypeScript compilation errors due to references in VSCode.

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCmPieceVisibilityTable1710185346752 implements MigrationInterface {
  name = 'CreateCmPieceVisibilityTable1710185346752';

  // Empty implementation as this migration is not actually used
  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is a placeholder migration that doesn't actually do anything
    // The real implementation uses the platform entity's existing properties
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a placeholder migration that doesn't actually do anything
    // The real implementation uses the platform entity's existing properties
  }
}
