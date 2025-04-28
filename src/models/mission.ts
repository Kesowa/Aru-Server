import dataSource from "../data-source";
import mission from "../schemas/mission";
import wrapper from "../utils/mongoWrapper";

export default wrapper.bind<mission>(dataSource.getRepository(mission));

