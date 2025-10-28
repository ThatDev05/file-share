const router = require('express').Router();
const File = require('../model/file');


router.get('/:uuid', async (req, res) => {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) {
        return res.status(404).render('download', { error: 'Link has expired' });
    }

    const filePath = `${__dirname}/../${file.path}`;
    res.download(filePath, file.filename, (err) => {
        if (err) {
            return res.status(500).render('download', { error: 'Could not download file.' });
        }
    });
    
})

module.exports = router;