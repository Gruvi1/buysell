create or replace function check_message_sender()
returns trigger as $$
    declare
        _buyer_id bigint;
        _seller_id bigint;
    begin
        select d.buyer_id, p.seller_id
        into _buyer_id, _seller_id
        from dialog d
        left join product p on d.product_id = p.id
        where d.id = new.dialog_id;

        if new.sender_id not in (_buyer_id, _seller_id) then
            raise exception 'Invalid sender_id for this dialog';
        end if;

        return new;
    end;
$$ language plpgsql;

create trigger trigger_check_message_sender
    before insert or update on message
    for each row
    execute function check_message_sender();

comment on function check_message_sender() is 'Функция, проверяющая, принадлежит ли отправитель диалогу';
comment on trigger trigger_check_message_sender on message is 'Триггер, запускающий валидацию поля sender_id перед записью';