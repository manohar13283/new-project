import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { FeedbackCategory } from '../../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsUUID()
  transactionId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsIn(Object.values(FeedbackCategory), { each: true })
  categories?: FeedbackCategory[];

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
