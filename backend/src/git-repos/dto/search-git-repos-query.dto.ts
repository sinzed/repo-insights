import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { GithubSearchLanguage } from '../github-search-language';

@ValidatorConstraint({ name: 'isCalendarDateString', async: false })
class IsCalendarDateStringConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === mo - 1 &&
      dt.getUTCDate() === d
    );
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid calendar date (YYYY-MM-DD)`;
  }
}

function IsCalendarDateString(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isCalendarDateString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCalendarDateStringConstraint,
    });
  };
}

export class SearchGitReposQueryDto {
  @ApiProperty({
    enum: GithubSearchLanguage,
    enumName: 'GithubSearchLanguage',
    example: GithubSearchLanguage.TypeScript,
    description:
      'Allowed GitHub repository language (linguist-style slug). Compare `github-search-language.ts`.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Query parameter "language" is required' })
  @IsEnum(GithubSearchLanguage, {
    message: 'language must be one of the supported GitHub language values',
  })
  language!: GithubSearchLanguage;

  @ApiProperty({
    example: '2026-05-01',
    description: 'Only repos with push activity after this date (YYYY-MM-DD)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Query parameter "changedAfter" is required' })
  @IsCalendarDateString()
  changedAfter!: string;

  @ApiPropertyOptional({
    type: 'integer',
    example: 1,
    description: '1-based page number',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({
    type: 'integer',
    example: 30,
    description: 'Page size (max 100)',
    default: 30,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  @IsInt({ message: 'perPage must be an integer' })
  @Min(1, { message: 'perPage must be at least 1' })
  @Max(100, { message: 'perPage must not exceed 100' })
  perPage?: number;
}
