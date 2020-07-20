# fblog


## Usage

Save service account in file firebase-adminsdk.json in the directory credentials.

```
credentials/firebase-adminsdk.json
```

```
const fbLog = new FBLog();
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
const fbLog = new FBLog();
fbLog.set("fblog",{desc: "description to log", action: "activate"})

```
