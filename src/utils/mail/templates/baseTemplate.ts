export const baseTemplate = (content: string, title?: string) => {
  const html = `

<!DOCTYPE html>

<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title || 'Email'}</title>

<style>
  body {
    margin:0;
    padding:0;
    background:#F7F6F3;
    font-family: Inter, Arial, sans-serif;
  }

  .container {
    width:100%;
    padding:16px;
  }

  .card {
    width:100%;
    background:#FFFFFF;
    border-radius:12px;
    overflow:hidden;
  }

  .header {
    background:#D8E7F2;
    padding:20px;
    text-align:center;
    font-family:'Playfair Display', Georgia, serif;
    color:#2F2F2F;
    font-size:20px;
  }

  .content {
    padding:16px;
  }

  .footer {
    padding:12px;
    text-align:center;
    font-size:12px;
    color:#757575;
    border-top:1px solid #E5E5E5;
  }

  .btn {
    display:block;
    width:100%;
    text-align:center;
    background:#9A6239;
    color:#FFFFFF !important;
    padding:12px;
    border-radius:8px;
    text-decoration:none;
    font-weight:600;
  }

  @media screen and (min-width:600px) {
    .container {
      padding:40px 0;
    }

    .card {
      max-width:600px;
      margin:0 auto;
      box-shadow:0 4px 12px rgba(47,47,47,0.08);
    }

    .content {
      padding:24px;
    }

    .btn {
      display:inline-block;
      width:auto;
      padding:12px 20px;
    }
  }
</style>

</head>

<body>
  <div class="container">
    <table width="100%">
      <tr>
        <td align="center">

      <table class="card">

        <!-- HEADER -->
        <tr>
          <td class="header">
            Jolie Brasserie Café
          </td>
        </tr>

        <!-- CONTENT -->
        <tr>
          <td class="content">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td class="footer">
            © ${new Date().getFullYear()} Jolie Brasserie Café
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

  </div>
</body>
</html>
  `;

  return html;
};
