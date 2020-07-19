
import admin from "firebase-admin";
import {App} from "./firebaseAdmin";

import WriteResult = admin.firestore.WriteResult;
import DocumentData = admin.firestore.DocumentData;
import * as firebase from "@firebase/testing";
const app = App();
const db = app.firestore();



import * as os from "os";


class FBLog {
    constructor(
        public db: admin.firestore.Firestore | firebase.firestore.Firestore
    ) {}

    set(path: string, data: DocumentData): Promise<WriteResult> | Promise<void> {
        return this.db.doc(path).set(data);
    }

    log(path: string, data: DocumentData): Promise<WriteResult> | Promise<void> {
        const timeStamp = new Date();
        data.timeStamp = timeStamp.toISOString();
        return this.db
            .doc(`${path}/timeStamp/${timeStamp.toISOString()}`)
            .set(data);
    }

    archive(path: string, data: any) {
        const d = new Date();
        data.hostname = os.hostname();
        data.loadavg = os.loadavg();
        data.freemem = os.freemem();
        data.interfaces = os.networkInterfaces();
        try {
            this.db.doc(`fblog/u/archive/${path}/${d.toISOString()}`).set(data);
        } catch (error) {
            this.db.doc(`error/fblog/archive/${d.toISOString()}`).set({
                error: error.message,
            });
        }
    }

    onSnapshot(
        path: string,
        key: string,
        value: string,
        changeType: string,
        callback: any
    ) {
        const observer = this.db
            .collection(path)
            .where(key, "==", value)
            .onSnapshot((querySnapshot: any) => {
                querySnapshot.docChanges().forEach((change: any) => {
                    if (change.type === changeType) {
                        console.log("HIT: ", change.doc.data());
                        callback(change.doc.data());
                    }

                    if (change.type === "added") {
                        console.log("Added: ", change.doc.data());
                    }
                    if (change.type === "modified") {
                        console.log("Modified: ", change.doc.data());
                    }
                    if (change.type === "removed") {
                        console.log("Removed: ", change.doc.data());
                    }
                });
            });
        return observer;
    }


}


export { WriteResult, db, FBLog };
