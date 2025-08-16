import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITest extends Document {
    message: string;
    createdAt: Date;
}

const TestSchema: Schema<ITest> = new Schema({
    message: {
        type: String,
        required: false,
        default: 'Hello MongoDB!'
    },
});


const TestModel: Model<ITest> = mongoose.model<ITest>("TestModel", TestSchema);
export default TestModel;
