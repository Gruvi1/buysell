create table if not exists user_role
(
    user_id     bigint      not null references "user"(id),
    role_id     bigint      not null references role(id),

    primary key(user_id, role_id)
);

comment on table user_role is 'Таблица отношений пользователь-роль многие-ко-многим';

comment on column user_role.user_id is 'Внешний ключ на пользователя';
comment on column user_role.role_id is 'Внешний ключ на роль';