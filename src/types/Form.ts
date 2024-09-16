import { objectType } from 'nexus';

export const Form = objectType({
  name: 'Form',
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.subTitle();
    t.model.image();
    t.model.fields({ ordering: true, filtering: true, pagination: true });
    t.model.createdAt();
  },
});

export const FormField = objectType({
  name: 'FormField',
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.placeholder();
    t.model.max();
    t.model.value();
  },
});
