import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating a chat
 */
export class UpdateChatDto {
  /**
   * Optional chat name
   */
  @IsOptional()
  @IsString()
  name?: string;
}
