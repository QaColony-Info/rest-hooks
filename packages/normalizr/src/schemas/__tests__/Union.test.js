// eslint-env jest
import { fromJS } from 'immutable';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema } from '../../';
import IDEntity from '../../entities/IDEntity';

describe(`${schema.Union.name} normalization`, () => {
  test('throws if not given a schemaAttribute', () => {
    expect(() => new schema.Union({})).toThrow();
  });

  test('normalizes an object using string schemaAttribute', () => {
    class User extends IDEntity {}
    class Group extends IDEntity {}
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );

    expect(normalize({ id: 1, type: 'users' }, union)).toMatchSnapshot();
    expect(normalize({ id: 2, type: 'groups' }, union)).toMatchSnapshot();
  });

  test('normalizes an array of multiple entities using a function to infer the schemaAttribute', () => {
    class User extends IDEntity {}
    class Group extends IDEntity {}
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : input.groupname ? 'groups' : null;
      },
    );

    expect(normalize({ id: 1, username: 'Janey' }, union)).toMatchSnapshot();
    expect(normalize({ id: 2, groupname: 'People' }, union)).toMatchSnapshot();
    expect(normalize({ id: 3, notdefined: 'yep' }, union)).toMatchSnapshot();
  });
});

describe(`${schema.Union.name} denormalization`, () => {
  class User extends IDEntity {}
  class Group extends IDEntity {}
  const entities = {
    User: {
      1: { id: 1, username: 'Janey', type: 'users' },
    },
    Group: {
      2: { id: 2, groupname: 'People', type: 'groups' },
    },
  };

  test('denormalizes an object using string schemaAttribute', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      'type',
    );

    expect(
      denormalize({ id: 1, schema: 'users' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ id: 1, schema: 'users' }), union, fromJS(entities)),
    ).toMatchSnapshot();

    expect(
      denormalize({ id: 2, schema: 'groups' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ id: 2, schema: 'groups' }), union, fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('denormalizes an array of multiple entities using a function to infer the schemaAttribute', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : 'groups';
      },
    );

    expect(
      denormalize({ id: 1, schema: 'users' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ id: 1, schema: 'users' }), union, fromJS(entities)),
    ).toMatchSnapshot();

    expect(
      denormalize({ id: 2, schema: 'groups' }, union, entities),
    ).toMatchSnapshot();
    expect(
      denormalize(fromJS({ id: 2, schema: 'groups' }), union, fromJS(entities)),
    ).toMatchSnapshot();
  });

  test('returns the original value no schema is given', () => {
    const union = new schema.Union(
      {
        users: User,
        groups: Group,
      },
      input => {
        return input.username ? 'users' : 'groups';
      },
    );

    expect(denormalize({ id: 1 }, union, entities)).toMatchSnapshot();
    expect(
      denormalize(fromJS({ id: 1 }), union, fromJS(entities)),
    ).toMatchSnapshot();
  });
});
