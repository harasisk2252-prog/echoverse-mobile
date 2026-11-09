import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
test('Postgres policies enforce invitations, membership, private media, and server-time capsules',async()=>{
 const db=new PGlite({extensions:{pgcrypto}});
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth,storage to authenticated;grant execute on function auth.uid() to authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,delete on storage.objects to authenticated;create function storage.foldername(name text) returns text[] language sql as $$select string_to_array(name,'/')$$;`);
 await db.exec(readFileSync('supabase/migrations/202611080001_echoverse.sql','utf8'));
 const alice='00000000-0000-4000-8000-000000000001',bob='00000000-0000-4000-8000-000000000002',eve='00000000-0000-4000-8000-000000000003';
 await db.query('insert into auth.users values ($1),($2),($3)',[alice,bob,eve]);
 async function as(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
 async function scalar(sql,params=[]){return Object.values((await db.query(sql,params)).rows[0])[0];}
 await as(alice);const group=await scalar("select create_universe('Test stars')");const token=await scalar('select create_invite($1)',[group]);
 const record=await scalar("insert into cloud_records(kind,universe_id,payload) values('memory',$1,'{\"story\":\"private group\"}') returning id",[group]);
 const privateRecord=await scalar("insert into cloud_records(kind,payload) values('memory','{}') returning id");
 await as(eve);assert.equal(await scalar('select count(*) from cloud_records'),0);await assert.rejects(db.query('select create_invite($1)',[group]));
 await as(bob);await db.query('select accept_invite($1)',[token]);assert.equal(await scalar('select count(*) from cloud_records'),1);assert.equal(await scalar('select can_read_record($1)',[privateRecord]),false);await assert.rejects(db.query('select accept_invite($1)',[token]));await assert.rejects(db.query("insert into cloud_records(kind,owner_id,payload) values('memory',$1,'{}')",[alice]));
 const owned=await scalar("insert into cloud_records(kind,universe_id,payload) values('memory',$1,'{}') returning id",[group]);await assert.rejects(db.query('update cloud_records set universe_id=null where id=$1',[owned]));
 await as(alice);const revoked=await scalar('select create_invite($1)',[group]);const inviteId=await scalar('select id from universe_invites where used_at is null limit 1');await db.query('select revoke_invite($1)',[inviteId]);
 await as(eve);await assert.rejects(db.query('select accept_invite($1)',[revoked]));
 await as(alice);await db.query('delete from universe_members where universe_id=$1 and user_id=$2',[group,bob]);await as(bob);assert.equal(await scalar('select count(*) from cloud_records'),0);assert.equal(await scalar('select can_read_media($1)',[`${alice}/records/${record}/photo`]),false);
 await as(alice);const capsule=await scalar("select create_capsule('Future me',now()+interval '1 day')");const audioPath=`${alice}/capsules/${capsule}/voice`;await db.query("insert into storage.objects(bucket_id,name) values('echoverse-private',$1)",[audioPath]);await db.query('select seal_capsule($1,$2,$3)',[capsule,'A secret for tomorrow',audioPath]);assert.equal(await scalar('select count(*) from capsule_bodies'),0);assert.equal(await scalar('select count(*) from storage.objects'),0);assert.equal((await db.query('select * from capsule_status()')).rows[0].available,false);await assert.rejects(db.query("insert into capsule_replies(capsule_id,body) values($1,'too early')",[capsule]));await assert.rejects(db.query('select seal_capsule($1,$2,null)',[capsule,'overwrite']));
 // Only the test database administrator advances the release instant; client roles cannot.
 await db.exec('reset role');await db.query("update capsules set unlock_at=now()-interval '1 second' where id=$1",[capsule]);await as(alice);assert.equal(await scalar('select count(*) from capsule_bodies'),1);assert.equal(await scalar('select count(*) from storage.objects'),1);await db.query("insert into capsule_replies(capsule_id,body) values($1,'Hello past self')",[capsule]);
 await as(eve);assert.equal(await scalar('select count(*) from capsules'),0);assert.equal(await scalar('select count(*) from capsule_bodies'),0);assert.equal(await scalar('select count(*) from capsule_replies'),0);assert.equal(await scalar('select count(*) from storage.objects'),0);
 }finally{await db.close();}
});
