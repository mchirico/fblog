
## Usage

Save service account in file firebase-adminsdk.json in the directory credentials.

```
credentials/firebase-adminsdk.json
```

```
import {FBLog, db} from "@mchirico/fblog";


const fbLog = new FBLog(db);
const obs = fbLog.onSnapshot(
      "fblog",
      "action",
      "activate",
      "add",
      (doc: any) => {
        console.log("Document added...................callback:", doc?.desc);
      }
    );

// Eventually terminate the observable
obs();
```


In another program, maybe on another system

```
import {FBLog, db} from "@mchirico/fblog";

const fbLog = new FBLog(db);
fbLog.set("fblog",{desc: "description to log", action: "activate"})

```
