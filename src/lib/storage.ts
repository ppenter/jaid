import Storage from "node-storage";

const storage = new Storage(`${process.cwd()}/.jaid/storage.json`);

export default storage;
