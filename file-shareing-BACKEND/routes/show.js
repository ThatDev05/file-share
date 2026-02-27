const router = require('express').Router();
const File = require('../model/file');


    router.get('/info/:uuid', async (req, res) => {
        try {
            const file = await File.findOne({ uuid: req.params.uuid });
            if (!file) {
                return res.status(404).json({ error: 'Link has expired' });
            }
            return res.json({
                uuid: file.uuid,
                fileName: file.filename,
                fileSize: file.size,
                downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}`
            });
        } catch (err) {
                return res.status(500).json({ error: 'Something went wrong' });

        }
    })


module.exports = router;