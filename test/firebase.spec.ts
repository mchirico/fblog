import "mocha";

import * as firebase from "@firebase/testing";
import { FBLog } from "../src/firebase";
import * as admin from "firebase-admin";
import { expect } from "chai";
import * as sinon from "sinon";
import DocumentData = admin.firestore.DocumentData;
import DocumentReference = admin.firestore.DocumentReference;
import { clearFirestoreData } from "@firebase/testing";

// Manual testing:
//   firebase emulators:start
const MY_PROJECT_ID = "septapig";

const myAuth = { uid: "user_abc", email: "abc@gmail.com", admin: true };

function timeOut(ms: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDBuser(): firebase.firestore.Firestore {
  return firebase
    .initializeTestApp({
      projectId: MY_PROJECT_ID,
      auth: myAuth,
    })
    .firestore();
}

function getDBadmin(): firebase.firestore.Firestore {
  return firebase
    .initializeAdminApp({
      projectId: MY_PROJECT_ID,
    })
    .firestore();
}

let lastPath = "";

function fakeDoc(path: string): DocumentReference<DocumentData> | any {
  const mdb = getDBadmin();
  console.log("path:", path);

  lastPath = path;
  const newpath = path.replace(/\//g, "_");
  console.log("**********************************************");
  console.log("   (below)");
  console.log(`true path:\n  test/${newpath}`);
  return mdb.doc(`test/${newpath}`);
}

describe("Firebase test ...", function () {
  before(async function () {
    await clearFirestoreData({ projectId: MY_PROJECT_ID });
  });

  afterEach(async function () {
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  // TODO: You need the emulator for this test
  //   firebase emulators:start --project septapig
  it("log", async function () {
    const path = "log/test";
    const db = getDBadmin();

    await db.doc(path).delete();
    const fbLog = new FBLog(db);
    await fbLog.log(path, { data: "works" });
    const testQuery = db.doc(path);
    const doc = await testQuery.get();

    if (!doc.exists) {
      console.log("No such document!");
    } else {
      console.log("Document data:", doc.data());
      expect(doc.data()?.timeStamp).to.exist;
    }
    expect(doc.exists).to.exist;

    await firebase.assertSucceeds(testQuery.get());
  });

  it("Test snapshot ", async function () {
    const path = "/items/1";
    const db = getDBadmin();
    const fbLog = new FBLog(db);
    await fbLog.set(path, { action: "hold", fb: "yes...fbk", minutes: 20 });

    const obs = fbLog.onSnapshot(
      "items",
      "action",
      "activate",
      "added",
      (r: DocumentData) => {
        console.log("here....", r.desc);
        expect(r.desc).to.contain("yes_worked");
        // const result = fbk.createSubscription(r);
        // expect(result.endpoint).to.contain("endpoint");
      }
    );
    await fbLog.set(path, {
      action: "activate",
      desc: "yes_worked",
      endpoint: "endpoint",
      p256dh: "p256dh",
      auth: "auth",
      minutes: 20,
    });

    obs();
    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());
  });

  it("Test snapshot minutes", async function () {
    const path = "/items/1";
    const db = getDBadmin();
    const fbLog = new FBLog(db);
    await fbLog.set(path, { data: "works", fb: "yes...fbk", minutes: 20 });

    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());
    // Check results
    const dataRef = db.doc(path);
    const doc = await dataRef.get();

    if (!doc.exists) {
      console.log("No such document!");
    } else {
      console.log("Document data:", doc.data());
    }
    await firebase.assertSucceeds(doc.data()?.data);
    expect(await doc.data()?.data).to.equal("works");
    await console.log("here: ", doc.data()?.data);
  });

  it("Test snapshot listener0", async function () {
    const path = "/items/1";
    const db = getDBadmin();
    const fbLog = new FBLog(db);
    await fbLog.set(path, { data: "works", fb: "yes...fbk" });

    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());
  });

  it("Test snapshot listener1", async function () {
    const path = "/items/1";
    const db = getDBuser();
    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());
  });

  // TODO: You need the emulator for this test
  it("Test snapshot listener2", async function () {
    const path = "/items/1";

    const db = getDBadmin();

    await db.doc(path).set({ junk: "here 1 2 3" });
  });

  it("Test db.doc(path).set({...})", async function () {
    const path = "/items/1";
    const db = getDBadmin();

    const docStub = sinon.stub(db, "doc").callsFake(fakeDoc);
    await db.doc(path).set({ junk: "here 1 2 3" });

    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());

    const dataRef = db.doc(path);
    const doc = await dataRef.get();
    if (!doc.exists) {
      console.log("No such document!");
    } else {
      console.log("Document data:", doc.data());
    }
    expect(doc.data()?.junk).to.equal("here 1 2 3");
    docStub.restore();
  });
});

describe("Fake tests ...", function () {
  let db: any;
  before(async function () {
    db = getDBadmin();
    await clearFirestoreData({ projectId: MY_PROJECT_ID });
  });

  afterEach(async function () {
    await Promise.all(firebase.apps().map((app) => app.delete()));
  });

  it("should log", async function () {
    const path = "/items/1";

    const docStub = sinon.stub(db, "doc").callsFake(fakeDoc);

    const fbLog = new FBLog(db);

    await fbLog.log(path, { data: "example" });

    const epath = lastPath;

    const testQuery = db.doc(epath);
    await firebase.assertSucceeds(testQuery.get());

    const dataRef = db.doc(epath);
    const doc = await dataRef.get();
    if (!doc.exists) {
      console.log("No such document!");
    } else {
      console.log("Document data:", doc.data());
    }

    const earray = epath.split("/");
    const expectedDate = earray[earray.length - 1];

    expect(doc.data()?.timeStamp).to.equal(expectedDate);
    docStub.restore();
  });

  it("should archive", async function () {
    const path = "/items/1";
    const db = getDBadmin();
    const docStub = sinon.stub(db, "doc").callsFake(fakeDoc);

    const fbLog = new FBLog(db);

    fbLog.archive(path, { data: "example" });

    console.log("here...");
    await timeOut(500);

    console.log("here 3");

    //const epath = "pomodoro/u/archive//items/1/2019-02-01T05:00:00.000Z";
    const epath = lastPath;

    const testQuery = db.doc(epath);
    await firebase.assertSucceeds(testQuery.get());

    const dataRef = db.doc(epath);
    //const doc = await dataRef.get();
    const doc = await firebase.assertSucceeds(dataRef.get());
    if (!doc.exists) {
      console.log("No such document!");
    } else {
      console.log("Document data:", doc.data());
    }

    expect(doc.data()?.hostname).to.exist;
    expect(doc.data()?.loadavg).to.exist;
    expect(doc.data()?.freemem).to.exist;
    expect(doc.data()?.interfaces).to.exist;

    docStub.restore();
  });
});

describe("Edge case modify ...", function () {
  let db: any;
  let fbk: any;
  let docStub: any;

  before(async function () {
    db = getDBadmin();
    await clearFirestoreData({ projectId: MY_PROJECT_ID });
  });

  beforeEach(async function () {
    docStub = sinon.stub(db, "doc").callsFake(fakeDoc);
    fbk = new FBLog(db);
  });

  afterEach(async function () {
    await Promise.all(firebase.apps().map((app) => app.delete()));
    docStub.restore();
  });

  it("onSnapShot2 modified", async function () {
    const path = "snap/1";
    let wasCalled = false;

    const obs = fbk.onSnapshot(
      "test",
      "action",
      "activate",
      "modified",
      (doc: any) => {
        console.log("...................callback:", doc?.desc);
        expect(doc?.desc).to.equal("test modified");
        wasCalled = true;
      }
    );

    await db.doc(path).set({
      action: "activate",
      desc: "test added",
      uuid: "0",
      p256dh: "p256dh",
      minutes: 0.0001,
    });

    await db.doc(path).set({
      action: "activate",
      desc: "test modified",
      uuid: "0",
      p256dh: "p256dh",
      minutes: 0.0001,
    });

    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());
    expect(wasCalled).to.be.true;

    obs();
  });
});

// TODO: Can't run multple it ... does too much clean up
describe("Edge case remove ...", function () {
  let db: any;
  let fbLog: any;
  let docStub: any;

  before(async function () {
    db = getDBadmin();
    await clearFirestoreData({ projectId: MY_PROJECT_ID });
  });

  beforeEach(async function () {
    docStub = sinon.stub(db, "doc").callsFake(fakeDoc);
    fbLog = new FBLog(db);
  });

  afterEach(async function () {
    await Promise.all(firebase.apps().map((app) => app.delete()));
    docStub.restore();
  });

  it("onSnapShot removed", async function () {
    const path = "snap/1";

    let wasCalled = false;

    const obs = fbLog.onSnapshot(
      "test",
      "action",
      "activate",
      "removed",
      (doc: any) => {
        console.log("...................callback:", doc?.desc);
        expect(doc?.desc).to.equal("test removed");
        wasCalled = true;
      }
    );

    await db.doc(path).set({
      action: "activate",
      desc: "test removed",
      uuid: "0",
      p256dh: "p256dh",
      minutes: 0.0001,
    });

    await db.doc(path).delete();

    await timeOut(300);

    const testQuery = db.doc(path);
    await firebase.assertSucceeds(testQuery.get());
    expect(wasCalled).to.be.true;
    obs();
  });
});
