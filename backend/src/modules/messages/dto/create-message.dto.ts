import { IsString, IsNotEmpty, MaxLength, IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ForwardedDto {
  @IsMongoId()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  fromName?: string;  // Store the sender's name directly

  @IsMongoId()
  @IsOptional()
  originalChatId?: string;

  @IsMongoId()
  @IsOptional()
  originalMessageId?: string;

  @IsString()
  @IsOptional()
  originalCreatedAt?: string;
}

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  chat: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Message text must not exceed 10,000 characters' })
  text: string;

  @ValidateNested()
  @Type(() => ForwardedDto)
  @IsOptional()
  forwarded?: ForwardedDto;

  @IsMongoId()
  @IsOptional()
  replyTo?: string;
}
