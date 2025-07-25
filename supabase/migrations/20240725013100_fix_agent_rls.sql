-- Enable RLS on agents table if not already enabled
alter table public.agents enable row level security;

-- Create a policy that allows buyers to view their assigned agent
create policy "Buyers can view their assigned agent"
on public.agents
for select
using (
  exists (
    select 1 from public.buyers
    where buyers.agent_id = agents.id
    and auth.uid() = buyers.id
  )
);

-- Create a function to get agent by ID with RLS check
create or replace function public.get_agent_by_id(agent_id uuid)
returns json as $$
declare
  result json;
begin
  -- This will respect RLS policies
  select to_json(agents) into result
  from public.agents
  where id = agent_id
  and exists (
    select 1 from public.buyers
    where buyers.agent_id = agents.id
    and auth.uid() = buyers.id
  )
  limit 1;
  
  return result;
exception when others then
  return json_build_object('error', SQLERRM);
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users
grant execute on function public.get_agent_by_id to authenticated;
