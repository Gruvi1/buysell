insert into city (id, name)
values
    (1, 'Новосибирск'),
    (2, 'Москва'),
    (3, 'Санкт-Петербург')
on conflict (id) do nothing;

select setval(
    pg_get_serial_sequence('city', 'id'),
    greatest((select coalesce(max(id), 1) from city), 1)
);
