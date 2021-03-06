import { FetchAction } from 'rest-hooks/types';
import { FETCH_TYPE } from 'rest-hooks/actionTypes';
import {
  FetchShape,
  Schema,
  isDeleteShape,
  SchemaFromShape,
  ParamsFromShape,
  BodyFromShape,
  OptimisticUpdateParams,
} from 'rest-hooks/resource';

interface Options<
  Shape extends FetchShape<
    Schema,
    Readonly<object>,
    Readonly<object | string> | void
  >
> {
  params: ParamsFromShape<Shape>;
  body?: BodyFromShape<Shape>;
  throttle: boolean;
  updateParams?:
    | OptimisticUpdateParams<
        SchemaFromShape<Shape>,
        FetchShape<any, any, any>
      >[]
    | undefined;
}

/** Requesting a fetch to begin
 *
 * @param fetchShape
 * @param param1 { params, body, throttle, updateParams }
 */
export default function createFetch<
  Shape extends FetchShape<
    Schema,
    Readonly<object>,
    Readonly<object | string> | void
  >
>(
  fetchShape: Shape,
  { params, body, throttle, updateParams }: Options<Shape>,
): FetchAction {
  const { fetch, schema, type, getFetchKey, options } = fetchShape;

  let key = getFetchKey(params);
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    if (
      isDeleteShape(fetchShape) &&
      typeof fetchShape.schema.pk !== 'function'
    ) {
      throw new Error(
        `Request for '${key}' of type delete used, but schema has no pk().
Schema must be an entity.
Schema: ${JSON.stringify(fetchShape.schema, null, 2)}

Note: Network response is ignored for delete type.`,
      );
    }
  }
  if (isDeleteShape(fetchShape)) key = fetchShape.schema.pk(params);
  let resolve: (value?: any | PromiseLike<any>) => void = 0 as any;
  let reject: (reason?: any) => void = 0 as any;
  const promise = new Promise<any>((a, b) => {
    [resolve, reject] = [a, b];
  });
  const meta: FetchAction['meta'] = {
    schema,
    type,
    key,
    throttle,
    options,
    resolve,
    reject,
    promise,
  };

  if (updateParams) {
    meta.updaters = updateParams.reduce(
      (accumulator: object, [toShape, toParams, updateFn]) => ({
        [toShape.getFetchKey(toParams)]: updateFn,
        ...accumulator,
      }),
      {},
    );
  }

  if (options && options.optimisticUpdate) {
    meta.optimisticResponse = options.optimisticUpdate(params, body);
  }

  return {
    type: FETCH_TYPE,
    payload: () => fetch(params, body),
    meta,
  };
}
