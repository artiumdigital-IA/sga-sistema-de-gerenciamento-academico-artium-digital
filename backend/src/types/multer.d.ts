// Shim minimo: o pacote "multer" nao inclui suas proprias tipagens e o
// projeto nao instala @types/multer. Isso evita TS7016 (noImplicitAny)
// ao importar `multer` para configurar o storage de upload de arquivos.
declare module 'multer' {
  const multer: any;
  export = multer;
}
