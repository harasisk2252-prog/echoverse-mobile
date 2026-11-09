// Uses the user's configured Git credential manager; never prints or saves its token.
const {execFileSync}=require('node:child_process');
async function main(){
 const raw=execFileSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'},stdio:['pipe','pipe','pipe']});
 const credential=Object.fromEntries(raw.trim().split('\n').map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)]}));
 if(!credential.password)throw Error('GitHub CLI credentials are unavailable.');
 const headers={Authorization:`Bearer ${credential.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
 const user=await fetch('https://api.github.com/user',{headers}).then(r=>r.json());
 if(user.login!=='harasisk2252-prog')throw Error('Git credentials belong to a different account.');
 const endpoint='https://api.github.com/repos/harasisk2252-prog/echoverse-mobile';
 let response=await fetch(endpoint,{headers});
 if(response.status===404){response=await fetch('https://api.github.com/user/repos',{method:'POST',headers,body:JSON.stringify({name:'echoverse-mobile',description:'Personal memories, invite-only universes, and magical exploration. React Native + Expo.',private:false,auto_init:false})});}
 if(!response.ok)throw Error(`GitHub repository request failed (${response.status})`);
 const repo=await response.json();console.log(JSON.stringify({url:repo.html_url,private:repo.private,default_branch:repo.default_branch}));
}
main().catch(e=>{console.error(e.message.includes('credential')?'GitHub credential manager needs a sign-in.':e.message);process.exitCode=1});
