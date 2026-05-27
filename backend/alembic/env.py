from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Import settings tu du an de lay bien moi truong
from app.core.config import settings

# Import models de Alembic tu dong nhan dien su thay doi bang (autogenerate)
from app.models.schemas import Base 
target_metadata = Base.metadata

# Doi tuong config cua Alembic de truy cap vao file alembic.ini
config = context.config

# Ghi de cau hinh sqlalchemy.url mac dinh bang bien moi truong thuc te tu .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Thiet lap log cho Alembic neu co file cau hinh
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline() -> None:
    """
    Chay migrations o che do 'offline'.
    
    Che do nay chi tao ra cac lenh SQL dang text chu khong chay truc tiep 
    vao database. Khong can tao engine hay ket noi DB o day.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Chay migrations o che do 'online'.
    
    Che do nay se tao ket noi that den database thong qua Engine 
    va thuc thi truc tiep cac thay doi ve cau truc bang.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# Kiem tra xem nguoi dung dang goi lenh o che do nao de chay ham tuong ung
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
