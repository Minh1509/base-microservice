import { QueryBuilder } from '@mikro-orm/postgresql';
import { APP_DEFAULTS } from '../constants';
import { PaginationResponseDto, SuccessResponseDto } from '../dto';

export abstract class BaseService {
  async customPaginate<T extends object>(
    queryBuilder: QueryBuilder<T>,
    page: number = APP_DEFAULTS.PAGINATION.PAGE_DEFAULT,
    pageSize: number = APP_DEFAULTS.PAGINATION.LIMIT_DEFAULT,
  ): Promise<PaginationResponseDto<T>> {
    const offset = (+page - 1) * +pageSize;

    queryBuilder.limit(+pageSize).offset(offset);
    const [items, total] = await queryBuilder.getResultAndCount();
    const totalPages = +pageSize > 0 ? Math.ceil(total / +pageSize) : 1;

    return {
      data: items,
      pagination: {
        page: +page,
        pageSize: +pageSize,
        total,
        totalPages,
      },
    };
  }

  async customPaginateGetRawMany<T extends object>(
    queryBuilder: QueryBuilder<T>,
    page: number = APP_DEFAULTS.PAGINATION.PAGE_DEFAULT,
    pageSize: number = APP_DEFAULTS.PAGINATION.LIMIT_DEFAULT,
  ): Promise<PaginationResponseDto<T>> {
    const offset = (+page - 1) * +pageSize;

    const subQuery = queryBuilder.clone().getKnexQuery();
    const [{ count }] = await subQuery.client
      .queryBuilder()
      .count({ count: '*' })
      .from(subQuery.as('sub'));
    const total = Number(count) || 0;

    const items = await queryBuilder.clone().limit(+pageSize).offset(offset).execute();
    const totalPages = +pageSize > 0 ? Math.ceil(total / +pageSize) : 1;

    return {
      data: items,
      pagination: {
        page: +page,
        pageSize: +pageSize,
        total,
        totalPages,
      },
    };
  }

  protected responseSuccess(): SuccessResponseDto {
    return { success: true };
  }
}
