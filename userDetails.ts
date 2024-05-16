import mongoose, { Schema, Document } from 'mongoose';


// Custom validation function for email
const validateEmail = (email: string): boolean => {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(email);
};

const UserDetailsSchema =new mongoose.Schema(
  {
    userName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: validateEmail, // Assigning the custom validation function
        message: (props: { value: string }) => `${props.value} is not a valid email address!`,
      },
    },
    password: { type: String, required: true },
    watchList: { type: [String], default: [] },
  },
  {
    collection: 'UserInfo',
  }
);

mongoose.model('UserInfo', UserDetailsSchema);
