import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsMongoId,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as DOMPurify from 'isomorphic-dompurify';

export class CreateGroupDto {
  /**
   * Group name
   */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim() || '', { ALLOWED_TAGS: [] }))
  name: string;

  /**
   * Group description
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim() || '', { ALLOWED_TAGS: [] }))
  description?: string;

  /**
   * Group type
   */
  @IsEnum(['group', 'channel'])
  type: 'group' | 'channel';

  /**
   * Initial member IDs
   */
  @IsArray()
  @ArrayMinSize(1, { message: 'Group must have at least 1 member besides creator' })
  @ArrayMaxSize(99, { message: 'Cannot add more than 99 members at once' })
  @IsMongoId({ each: true })
  memberIds: string[];

  /**
   * Group avatar URL
   */
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AddMembersDto {
  /**
   * User IDs to add
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50, { message: 'Cannot add more than 50 members at once' })
  @IsMongoId({ each: true })
  userIds: string[];
}

export class UpdateMemberRoleDto {
  /**
   * New role for member
   */
  @IsEnum(['admin', 'member'])
  role: 'admin' | 'member';
}

export class UpdateGroupInfoDto {
  /**
   * Group name
   */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim() || '', { ALLOWED_TAGS: [] }))
  name?: string;

  /**
   * Group description
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => DOMPurify.sanitize(value?.trim() || '', { ALLOWED_TAGS: [] }))
  description?: string;

  /**
   * Group avatar URL
   */
  @IsOptional()
  @IsString()
  avatar?: string;

  /**
   * Group settings
   */
  @IsOptional()
  settings?: {
    muteNotifications?: boolean;
    allowJoinByLink?: boolean;
    approveNewMembers?: boolean;
  };
}

export class GenerateInviteLinkDto {
  /**
   * Link expiration in hours
   */
  @IsOptional()
  expiresIn?: number; // hours

  /**
   * Maximum uses of the link
   */
  @IsOptional()
  maxUses?: number;
}
