create or replace function refresh_dialog_timestamptz()
    returns trigger as $$
begin
    update dialog set updated_at = now() where id = new.dialog_id;
    return new;
end;
$$ language plpgsql;

create trigger trigger_refresh_dialog_timestamptz
    after insert on message
    for each row
execute function refresh_dialog_timestamptz();

comment on function refresh_dialog_timestamptz() is 'Обновляет updated_at в диалоге при добавлении сообщения';
comment on trigger trigger_refresh_dialog_timestamptz on message is 'Триггер синхронизации времени диалога';
