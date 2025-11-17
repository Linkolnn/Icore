import { IsString, IsNotEmpty, MaxLength, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  chat: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Message text must not exceed 10,000 characters' })
  text: string;
}
