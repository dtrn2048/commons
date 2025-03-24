// This is an empty placeholder file.
// The actual implementation uses the platform entity's filteredPieceNames and filteredPieceBehavior properties
// rather than a separate database entity.

// This file exists only to prevent TypeScript compilation errors due to references in VSCode.

export interface CmPieceVisibilityEntity {
  id: string
  pieceId: string
  pieceName: string  // Add the missing property
  platformId: string
  visible: boolean
  createdAt: Date
  updatedAt: Date
}

// Create a mock FindOptionsWhere type to satisfy TypeScript
export type FindOptionsWhere<T> = {
  [P in keyof T]?: T[P];
};
