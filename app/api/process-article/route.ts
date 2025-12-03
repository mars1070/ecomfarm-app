import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Créer un fichier temporaire
    const tempFilePath = join(tmpdir(), `upload-${Date.now()}.txt`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, buffer);

    // Chemin pour le fichier CSV de sortie
    const outputPath = join(tmpdir(), `output-${Date.now()}.csv`);

    // Exécuter le script Python
    const pythonProcess = spawn('python', [
      join(process.cwd(), 'scripts/process_articles.py'),
      tempFilePath,
      outputPath
    ]);

    // Attendre la fin du script Python
    const result = await new Promise<Buffer>((resolve, reject) => {
      let errorData = '';
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          // Nettoyer les fichiers temporaires en cas d'erreur
          await unlink(tempFilePath).catch(console.error);
          await unlink(outputPath).catch(console.error);
          reject(new Error(`Erreur Python: ${errorData || 'Code de sortie ' + code}`));
          return;
        }

        try {
          // Lire le fichier CSV généré
          const { readFile } = await import('fs/promises');
          const csvData = await readFile(outputPath);
          
          // Nettoyer les fichiers temporaires
          await unlink(tempFilePath);
          await unlink(outputPath);
          
          resolve(csvData);
        } catch (e) {
          reject(e);
        }
      });
    });

    // Retourner le fichier CSV
    return new Response(Buffer.from(result), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="articles_export.csv"',
      },
    });

  } catch (error) {
    console.error('Erreur lors du traitement du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier' },
      { status: 500 }
    );
  }
}
