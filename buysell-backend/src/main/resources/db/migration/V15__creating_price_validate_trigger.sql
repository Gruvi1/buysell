create or replace function validate_product_price()
    returns trigger as $$
begin
    if new.price < 0 then
        raise exception 'Цена товара должна быть больше нуля';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_validate_product_price
    before insert or update of price on product
    for each row
execute function validate_product_price();

comment on function validate_product_price() is 'Проверяет, что цена товара неотрицательная';
comment on trigger trigger_validate_product_price on product is 'Триггер валидации цены';
