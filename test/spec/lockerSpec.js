
var Locker = require("../../lib/locker");

describe ("Locker", function() {

  it ("should lock a page", function() {
    Locker.lock("antani", {});
    expect(Locker.getLock("antani")).not.be.a("null");
    expect(Locker.getLock("antani2")).to.be.a("null");
  });

  it ("should unlock a page", function() {
    Locker.lock("antani", {});
    Locker.unlock("antani");
    expect(Locker.getLock("antani")).to.be.a("null")
  });

  it ("should reset the locks", function() {
    Locker.lock("antani1", {});
    Locker.lock("antani2", {});
    expect(Locker.count()).to.equal(2);
    Locker.reset();
    expect(Locker.count()).to.equal(0);
  });

  it ("should purge old locks", function() {
    Locker.lock("antani1", {});
    Locker.lock("antani2", {});
    Locker.purge();
    expect(Locker.count()).to.equal(2);
    var lock = Locker.getLock("antani2");
    lock.ts = lock.ts - (Locker.purgeTime + 1);
    Locker.purge();
    expect(Locker.count()).to.equal(1);
  });

});