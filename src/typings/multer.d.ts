// declare module "multer"
namespace Express {
  namespace Multer {
    interface File {
      tempPath?: string;
    }
  }
}
