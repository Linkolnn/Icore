import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a new chat
 */
export class CreateChatDto {
  /**
   * Chat type
   */
  @IsEnum(['personal', 'group', 'channel'])
  type: 'personal' | 'group' | 'channel';

  /**
   * ID of the participant to add (for personal chats, this is the other user)
   */
  @IsMongoId()
  participantId: string;

  /**
   * Optional chat name (for groups/channels)
   */
  @IsOptional()
  @IsString()
  name?: string;
}
