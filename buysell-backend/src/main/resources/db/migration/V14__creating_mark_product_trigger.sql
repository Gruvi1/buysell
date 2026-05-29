create or replace function mark_product_sold_on_approval()
    returns trigger as $$
begin
    if new.is_approved and not old.is_approved then
        update product set sold = true where id = new.product_id;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trigger_mark_product_sold_on_approval
    after update of is_approved on deal
    for each row
execute function mark_product_sold_on_approval();

comment on function mark_product_sold_on_approval() is 'Помечает товар проданным при изменении флага is_approved';
comment on trigger trigger_mark_product_sold_on_approval on deal is 'Триггер синхронизации статуса товара и сделки';
