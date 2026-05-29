create or replace function enforce_single_main_image()
    returns trigger as $$
begin
    if new.is_main = true then
        update product_image
        set is_main = false
        where product_id = new.product_id and id <> new.id;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_enforce_single_main_image
    before insert or update of is_main on product_image
    for each row
execute function enforce_single_main_image();

comment on function enforce_single_main_image() is 'Сбрасывает флаг is_main у остальных изображений товара';
comment on trigger trigger_enforce_single_main_image on product_image is 'Триггер ограничения количества главных изображений';