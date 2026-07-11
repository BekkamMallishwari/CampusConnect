declare module '../config/db' {
  const connectDB: () => Promise<void>;
  export default connectDB;
}
