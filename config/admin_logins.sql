-- Create admin_logins table
create table admin_logins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password text not null, -- Store hashed passwords in production!
  created_at timestamp with time zone default now()
);

-- Insert admin user (plain text password for demo only)
insert into admin_logins (email, password)
values ('admin@gmail.com', 'admin123');
