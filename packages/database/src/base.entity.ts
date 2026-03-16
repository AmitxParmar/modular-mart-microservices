import {
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

/**
 * Abstract BaseEntity that all service-level entities should extend.
 *
 * Automatically provides:
 * 1. An `id` column using UUIDv7 (time-ordered, great for B-Tree indexing).
 * 2. `createdAt` tracking when the row was first inserted.
 * 3. `updatedAt` tracking every time the row is modified.
 */
export abstract class BaseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Generates a UUIDv7 before inserting the record into the database.
   * Native Postgres gen_random_uuid() is v4 (random), which causes index
   * fragmentation. v7 is time-sorted.
   */
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
